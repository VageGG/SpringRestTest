package org.example.service;


import lombok.RequiredArgsConstructor;
import org.example.dto.UserDto;
import org.example.entity.Role;
import org.example.entity.User;
import org.example.exception.UserNotFoundException;
import org.example.repository.RoleRepository;
import org.example.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return toDto(user);
    }

    public UserDto createUser(UserDto userDto) {
        User user = toEntity(userDto);
        if (userDto.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        return toDto(userRepository.save(user));
    }

    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        user.setName(userDto.getName());
        user.setAge(userDto.getAge());
        user.setEmail(userDto.getEmail());
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        // update roles
        user.getRoles().clear();
        user.getRoles().addAll(userDto.getRoles().stream()
                .map(rn -> roleRepository.findByName(rn)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + rn)))
                .collect(Collectors.toSet()));

        userRepository.save(user);

        return toDto(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) throw new UserNotFoundException(id);
        userRepository.deleteById(id);
    }

    private UserDto toDto(User user) {
        UserDto dto = modelMapper.map(user, UserDto.class);
        dto.setRoles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()));
        dto.setPassword(null);
        return dto;
    }

    private User toEntity(UserDto dto) {
        User user = modelMapper.map(dto, User.class);
        if (dto.getRoles() != null) {
            user.setRoles(dto.getRoles().stream()
                    .map(rn -> roleRepository.findByName(rn)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + rn)))
                    .collect(Collectors.toSet()));
        }
        return user;
    }
}
