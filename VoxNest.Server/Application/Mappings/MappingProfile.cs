using AutoMapper;
using VoxNest.Server.Application.DTOs.Auth;
using VoxNest.Server.Application.DTOs.Post;
using VoxNest.Server.Application.DTOs.Log;
using VoxNest.Server.Domain.Entities.Content;
using VoxNest.Server.Domain.Entities.User;
using VoxNest.Server.Domain.Entities.System;

namespace VoxNest.Server.Application.Mappings;

/// <summary>
/// AutoMapper映射配置
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateUserMappings();
        CreatePostMappings();
        CreateLogMappings();
    }

    private void CreateUserMappings()
    {
        // User -> UserDto
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.DisplayName : src.Username))
            .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.Avatar : null))
            .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.UserRoles.Select(ur => ur.Role.Name).ToList()));

        // User -> PostAuthorDto
        CreateMap<User, PostAuthorDto>()
            .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.DisplayName : src.Username))
            .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.Profile != null ? src.Profile.Avatar : null));
    }

    private void CreatePostMappings()
    {
        // Post -> PostDto
        CreateMap<Post, PostDto>()
            .ForMember(dest => dest.Author, opt => opt.MapFrom(src => src.Author))
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.PostTags.Select(pt => pt.Tag).ToList()));

        // Post -> PostListDto
        CreateMap<Post, PostListDto>()
            .ForMember(dest => dest.Author, opt => opt.MapFrom(src => src.Author))
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.PostTags.Select(pt => pt.Tag).ToList()));

        // Category -> CategoryDto
        CreateMap<Category, CategoryDto>();

        // Tag -> TagDto
        CreateMap<Tag, TagDto>();
    }

    private void CreateLogMappings()
    {
        // LogEntry -> LogEntryDto
        CreateMap<LogEntry, LogEntryDto>()
            .ForMember(dest => dest.LevelName, opt => opt.MapFrom(src => src.Level.ToString()))
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.ToString()))
            .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.User != null ? src.User.Username : null));
    }
}
