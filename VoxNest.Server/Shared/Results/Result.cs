namespace VoxNest.Server.Shared.Results;

/// <summary>
/// 操作结果基类
/// </summary>
public class Result
{
    /// <summary>
    /// 是否成功
    /// </summary>
    public bool IsSuccess { get; protected set; }

    /// <summary>
    /// 错误信息
    /// </summary>
    public string ErrorMessage { get; protected set; } = string.Empty;

    /// <summary>
    /// 消息（成功或错误信息）
    /// </summary>
    public string Message => IsSuccess ? SuccessMessage : ErrorMessage;

    /// <summary>
    /// 成功消息
    /// </summary>
    public string SuccessMessage { get; protected set; } = string.Empty;

    /// <summary>
    /// 错误详细信息
    /// </summary>
    public List<string> ErrorDetails { get; protected set; } = new();

    protected Result(bool isSuccess, string errorMessage = "", string successMessage = "")
    {
        IsSuccess = isSuccess;
        ErrorMessage = errorMessage;
        SuccessMessage = successMessage;
    }

    /// <summary>
    /// 创建成功结果
    /// </summary>
    /// <returns></returns>
    public static Result Success() => new(true);

    /// <summary>
    /// 创建成功结果
    /// </summary>
    /// <param name="successMessage"></param>
    /// <returns></returns>
    public static Result Success(string successMessage) => new(true, "", successMessage);

    /// <summary>
    /// 创建失败结果
    /// </summary>
    /// <param name="errorMessage"></param>
    /// <returns></returns>
    public static Result Failure(string errorMessage) => new(false, errorMessage);

    /// <summary>
    /// 创建失败结果
    /// </summary>
    /// <param name="errorMessage"></param>
    /// <param name="errorDetails"></param>
    /// <returns></returns>
    public static Result Failure(string errorMessage, List<string> errorDetails)
    {
        var result = new Result(false, errorMessage);
        result.ErrorDetails = errorDetails;
        return result;
    }
}

/// <summary>
/// 带数据的操作结果
/// </summary>
/// <typeparam name="T"></typeparam>
public class Result<T> : Result
{
    /// <summary>
    /// 结果数据
    /// </summary>
    public T? Data { get; private set; }

    protected Result(bool isSuccess, T? data = default, string errorMessage = "", string successMessage = "") : base(isSuccess, errorMessage, successMessage)
    {
        Data = data;
    }

    /// <summary>
    /// 创建成功结果
    /// </summary>
    /// <param name="data"></param>
    /// <returns></returns>
    public static Result<T> Success(T data) => new(true, data);

    /// <summary>
    /// 创建成功结果
    /// </summary>
    /// <param name="data"></param>
    /// <param name="successMessage"></param>
    /// <returns></returns>
    public static Result<T> Success(T data, string successMessage) => new(true, data, "", successMessage);

    /// <summary>
    /// 创建失败结果
    /// </summary>
    /// <param name="errorMessage"></param>
    /// <returns></returns>
    public static new Result<T> Failure(string errorMessage) => new(false, default, errorMessage, "");

    /// <summary>
    /// 创建失败结果
    /// </summary>
    /// <param name="errorMessage"></param>
    /// <param name="errorDetails"></param>
    /// <returns></returns>
    public static new Result<T> Failure(string errorMessage, List<string> errorDetails)
    {
        var result = new Result<T>(false, default, errorMessage, "");
        result.ErrorDetails = errorDetails;
        return result;
    }
}

/// <summary>
/// 分页结果
/// </summary>
/// <typeparam name="T"></typeparam>
public class PagedResult<T> : Result<List<T>>
{
    /// <summary>
    /// 总记录数
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 当前页码
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// 每页大小
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// 总页数
    /// </summary>
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// 是否有上一页
    /// </summary>
    public bool HasPreviousPage => PageNumber > 1;

    /// <summary>
    /// 是否有下一页
    /// </summary>
    public bool HasNextPage => PageNumber < TotalPages;

    public PagedResult(bool isSuccess, List<T>? data = null, string errorMessage = "") : base(isSuccess, data, errorMessage)
    {
    }

    /// <summary>
    /// 创建成功的分页结果
    /// </summary>
    /// <param name="data"></param>
    /// <param name="totalCount"></param>
    /// <param name="pageNumber"></param>
    /// <param name="pageSize"></param>
    /// <returns></returns>
    public static PagedResult<T> Success(List<T> data, int totalCount, int pageNumber, int pageSize)
    {
        return new PagedResult<T>(true, data)
        {
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    /// <summary>
    /// 创建失败的分页结果
    /// </summary>
    /// <param name="errorMessage"></param>
    /// <returns></returns>
    public static new PagedResult<T> Failure(string errorMessage)
    {
        return new PagedResult<T>(false, null, errorMessage);
    }
}
