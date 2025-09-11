using System.Text.RegularExpressions;
using Markdig;
// UseAdvancedExtensions() 会自动包含这些扩展
// using Markdig.Extensions.AutoIdentifiers;
// using Markdig.Extensions.Tables;
// using Markdig.Extensions.TaskLists;
// using Markdig.Extensions.Footnotes;
// using Markdig.Extensions.EmphasisExtras;
using VoxNest.Server.Application.Interfaces;

namespace VoxNest.Server.Application.Services;

/// <summary>
/// Markdown处理服务实现
/// </summary>
public class MarkdownService : IMarkdownService
{
    private readonly MarkdownPipeline _pipeline;
    private readonly Regex _scriptTagRegex = new(@"<script[\s\S]*?</script>", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private readonly Regex _styleTagRegex = new(@"<style[\s\S]*?</style>", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private readonly Regex _htmlTagRegex = new(@"<[^>]+>", RegexOptions.Compiled);
    private readonly Regex _javascriptUrlRegex = new(@"javascript:", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    
    public MarkdownService()
    {
        // 配置Markdown管道，启用常用扩展
        _pipeline = new MarkdownPipelineBuilder()
            .UseAdvancedExtensions() // 这会自动启用大部分扩展包括Tables, TaskLists, Footnotes等
            .UseSoftlineBreakAsHardlineBreak() // 单个换行符转为<br>
            .Build();
    }

    /// <summary>
    /// 将Markdown内容转换为HTML
    /// </summary>
    /// <param name="markdownContent">Markdown内容</param>
    /// <returns>HTML内容</returns>
    public string ConvertToHtml(string markdownContent)
    {
        if (string.IsNullOrWhiteSpace(markdownContent))
            return string.Empty;

        try
        {
            // 首先清理输入内容
            var sanitizedMarkdown = SanitizeMarkdown(markdownContent);
            
            // 转换为HTML
            var html = Markdown.ToHtml(sanitizedMarkdown, _pipeline);
            
            // 进一步清理HTML
            html = SanitizeHtml(html);
            
            return html;
        }
        catch (Exception ex)
        {
            // 记录错误（这里可以使用日志框架）
            Console.WriteLine($"Markdown转换错误: {ex.Message}");
            return $"<p>内容解析错误，请检查Markdown格式。</p>";
        }
    }

    /// <summary>
    /// 验证Markdown内容是否安全
    /// </summary>
    /// <param name="markdownContent">Markdown内容</param>
    /// <returns>是否安全</returns>
    public bool ValidateContent(string markdownContent)
    {
        if (string.IsNullOrWhiteSpace(markdownContent))
            return true;

        // 检查是否包含危险的JavaScript URL
        if (_javascriptUrlRegex.IsMatch(markdownContent))
            return false;

        // 检查是否包含script标签
        if (_scriptTagRegex.IsMatch(markdownContent))
            return false;

        // 检查内容长度（防止过长内容）
        if (markdownContent.Length > 50000) // 50KB限制
            return false;

        return true;
    }

    /// <summary>
    /// 清理和净化Markdown内容
    /// </summary>
    /// <param name="markdownContent">Markdown内容</param>
    /// <returns>清理后的Markdown内容</returns>
    public string SanitizeMarkdown(string markdownContent)
    {
        if (string.IsNullOrWhiteSpace(markdownContent))
            return string.Empty;

        // 移除潜在的恶意内容
        var sanitized = markdownContent;
        
        // 移除JavaScript URL
        sanitized = _javascriptUrlRegex.Replace(sanitized, "");
        
        // 移除script标签
        sanitized = _scriptTagRegex.Replace(sanitized, "");
        
        // 移除style标签
        sanitized = _styleTagRegex.Replace(sanitized, "");

        // 限制最大长度
        if (sanitized.Length > 50000)
            sanitized = sanitized[..50000];

        return sanitized.Trim();
    }

    /// <summary>
    /// 从HTML中提取纯文本摘要
    /// </summary>
    /// <param name="htmlContent">HTML内容</param>
    /// <param name="maxLength">最大长度</param>
    /// <returns>纯文本摘要</returns>
    public string ExtractPlainText(string htmlContent, int maxLength = 200)
    {
        if (string.IsNullOrWhiteSpace(htmlContent))
            return string.Empty;

        // 移除HTML标签
        var plainText = _htmlTagRegex.Replace(htmlContent, " ");
        
        // 移除多余的空白字符
        plainText = Regex.Replace(plainText, @"\s+", " ").Trim();
        
        // 截取到指定长度
        if (plainText.Length > maxLength)
        {
            // 尝试在单词边界截取
            var truncated = plainText[..maxLength];
            var lastSpaceIndex = truncated.LastIndexOf(' ');
            
            if (lastSpaceIndex > maxLength * 0.8) // 如果最后一个空格位置合理
                truncated = truncated[..lastSpaceIndex];
                
            plainText = truncated + "...";
        }

        return plainText;
    }

    /// <summary>
    /// 清理HTML内容
    /// </summary>
    /// <param name="html">HTML内容</param>
    /// <returns>清理后的HTML</returns>
    private string SanitizeHtml(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return string.Empty;

        var sanitized = html;
        
        // 移除JavaScript相关的属性
        sanitized = Regex.Replace(sanitized, @"on\w+\s*=\s*[""'][^""']*[""']", "", RegexOptions.IgnoreCase);
        
        // 移除JavaScript URL
        sanitized = _javascriptUrlRegex.Replace(sanitized, "");
        
        // 为外部链接添加安全属性
        sanitized = Regex.Replace(sanitized, 
            @"<a\s+href\s*=\s*[""']https?://[^""']*[""'][^>]*>", 
            match => match.Value.Contains("rel=") ? match.Value : 
                     match.Value.Replace(">", @" rel=""noopener noreferrer"" target=""_blank"">"),
            RegexOptions.IgnoreCase);

        return sanitized;
    }
}
