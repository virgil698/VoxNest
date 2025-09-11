namespace VoxNest.Server.Application.Interfaces;

/// <summary>
/// Markdown处理服务接口
/// </summary>
public interface IMarkdownService
{
    /// <summary>
    /// 将Markdown内容转换为HTML
    /// </summary>
    /// <param name="markdownContent">Markdown内容</param>
    /// <returns>HTML内容</returns>
    string ConvertToHtml(string markdownContent);

    /// <summary>
    /// 验证Markdown内容是否安全
    /// </summary>
    /// <param name="markdownContent">Markdown内容</param>
    /// <returns>是否安全</returns>
    bool ValidateContent(string markdownContent);

    /// <summary>
    /// 清理和净化Markdown内容
    /// </summary>
    /// <param name="markdownContent">Markdown内容</param>
    /// <returns>清理后的Markdown内容</returns>
    string SanitizeMarkdown(string markdownContent);

    /// <summary>
    /// 从HTML中提取纯文本摘要
    /// </summary>
    /// <param name="htmlContent">HTML内容</param>
    /// <param name="maxLength">最大长度</param>
    /// <returns>纯文本摘要</returns>
    string ExtractPlainText(string htmlContent, int maxLength = 200);
}
