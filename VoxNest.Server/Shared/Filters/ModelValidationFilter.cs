using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using VoxNest.Server.Shared.Models;

namespace VoxNest.Server.Shared.Filters;

/// <summary>
/// 模型验证过滤器 - 自动处理模型验证错误
/// </summary>
public class ModelValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var errors = context.ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .SelectMany(x => x.Value!.Errors)
                .Select(x => x.ErrorMessage)
                .ToList();

            var response = ApiResponse.CreateValidationError(errors, context.HttpContext.TraceIdentifier);
            
            context.Result = new BadRequestObjectResult(response);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // 在动作执行后不需要做任何事情
    }
}

/// <summary>
/// 禁用自动模型验证的标记属性
/// 用于需要手动处理模型验证的控制器或动作
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class DisableModelValidationAttribute : Attribute
{
}

/// <summary>
/// 条件模型验证过滤器 - 支持禁用自动验证
/// </summary>
public class ConditionalModelValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        // 检查是否禁用了自动模型验证
        var disableValidation = context.ActionDescriptor.EndpointMetadata
            .OfType<DisableModelValidationAttribute>()
            .Any();

        if (disableValidation)
        {
            return;
        }

        // 检查控制器级别的禁用标记
        var controllerDisableValidation = context.Controller
            .GetType()
            .GetCustomAttributes(typeof(DisableModelValidationAttribute), true)
            .Any();

        if (controllerDisableValidation)
        {
            return;
        }

        // 执行模型验证
        if (!context.ModelState.IsValid)
        {
            var errors = CreateValidationErrors(context.ModelState);
            var response = ApiResponse.CreateValidationError(errors, context.HttpContext.TraceIdentifier);
            
            context.Result = new BadRequestObjectResult(response);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // 在动作执行后不需要做任何事情
    }

    private static List<string> CreateValidationErrors(Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary modelState)
    {
        var errors = new List<string>();

        foreach (var (key, value) in modelState)
        {
            if (value?.Errors.Count > 0)
            {
                foreach (var error in value.Errors)
                {
                    // 为字段错误添加字段名前缀
                    var errorMessage = string.IsNullOrEmpty(error.ErrorMessage) 
                        ? "验证失败" 
                        : error.ErrorMessage;

                    if (!string.IsNullOrEmpty(key) && !errorMessage.Contains(key))
                    {
                        errors.Add($"{GetFieldDisplayName(key)}: {errorMessage}");
                    }
                    else
                    {
                        errors.Add(errorMessage);
                    }
                }
            }
        }

        return errors;
    }

    private static string GetFieldDisplayName(string fieldName)
    {
        // 简单的字段名转换，可以根据需要扩展
        return fieldName switch
        {
            "Username" => "用户名",
            "Password" => "密码",
            "Email" => "邮箱",
            "Title" => "标题",
            "Content" => "内容",
            "CategoryId" => "分类",
            "PageNumber" => "页码",
            "PageSize" => "每页数量",
            _ => fieldName
        };
    }
}

/// <summary>
/// 请求日志过滤器 - 记录API请求和响应
/// </summary>
public class RequestLogFilter : IActionFilter
{
    private readonly ILogger<RequestLogFilter> _logger;

    public RequestLogFilter(ILogger<RequestLogFilter> logger)
    {
        _logger = logger;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var request = context.HttpContext.Request;
        
        _logger.LogInformation(
            "API请求开始 - {Method} {Path} | 控制器: {Controller} | 动作: {Action} | TraceId: {TraceId}",
            request.Method,
            request.Path,
            context.RouteData.Values["controller"],
            context.RouteData.Values["action"],
            context.HttpContext.TraceIdentifier);

        // 记录请求参数（敏感信息除外）
        if (context.ActionArguments.Any())
        {
            var sanitizedArgs = SanitizeArguments(context.ActionArguments);
            _logger.LogDebug(
                "API请求参数 | TraceId: {TraceId} | 参数: {@Arguments}",
                context.HttpContext.TraceIdentifier,
                sanitizedArgs);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        var statusCode = context.HttpContext.Response.StatusCode;
        var actionName = $"{context.RouteData.Values["controller"]}.{context.RouteData.Values["action"]}";

        if (context.Exception == null)
        {
            _logger.LogInformation(
                "API请求完成 - {Action} [{StatusCode}] | TraceId: {TraceId}",
                actionName,
                statusCode,
                context.HttpContext.TraceIdentifier);
        }
        else
        {
            _logger.LogError(context.Exception,
                "API请求异常 - {Action} [{StatusCode}] | 异常: {ExceptionType} | TraceId: {TraceId}",
                actionName,
                statusCode,
                context.Exception.GetType().Name,
                context.HttpContext.TraceIdentifier);
        }
    }

    private static Dictionary<string, object?> SanitizeArguments(IDictionary<string, object?> arguments)
    {
        var sanitized = new Dictionary<string, object?>();
        
        foreach (var (key, value) in arguments)
        {
            // 过滤敏感信息
            if (IsSensitiveField(key))
            {
                sanitized[key] = "***";
            }
            else if (value != null && IsSensitiveObject(value))
            {
                sanitized[key] = SanitizeObject(value);
            }
            else
            {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    private static bool IsSensitiveField(string fieldName)
    {
        var sensitiveFields = new[] 
        { 
            "password", "pwd", "secret", "token", "key", "credential"
        };
        
        return sensitiveFields.Any(field => 
            fieldName.Contains(field, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsSensitiveObject(object obj)
    {
        var objType = obj.GetType();
        var properties = objType.GetProperties();
        
        return properties.Any(prop => IsSensitiveField(prop.Name));
    }

    private static object SanitizeObject(object obj)
    {
        var objType = obj.GetType();
        var properties = objType.GetProperties();
        var sanitized = new Dictionary<string, object?>();
        
        foreach (var prop in properties)
        {
            var value = prop.GetValue(obj);
            if (IsSensitiveField(prop.Name))
            {
                sanitized[prop.Name] = "***";
            }
            else
            {
                sanitized[prop.Name] = value;
            }
        }
        
        return sanitized;
    }
}
