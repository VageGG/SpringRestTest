package org.example.controller;

import lombok.RequiredArgsConstructor;
import org.example.dto.UserDto;
import org.example.entity.Role;
import org.example.entity.User;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ModelMapper modelMapper;

    @GetMapping("/user")
    public UserDto getCurrentUser(@AuthenticationPrincipal User user) {
        return toDto(user);
    }

    private UserDto toDto(User user) {
        UserDto dto = modelMapper.map(user, UserDto.class);
        dto.setRoles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()));
        dto.setPassword(null);
        return dto;
    }
}
