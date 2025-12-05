package org.example.service;


import lombok.RequiredArgsConstructor;
import org.example.dto.UserDto;
import org.example.entity.Role;
import org.example.entity.User;
import org.example.exception.EmailAlreadyExistsException;
import org.example.exception.RoleNotFoundException;
import org.example.exception.UserNotFoundException;
import org.example.repository.RoleRepository;
import org.example.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;

    public List<UserDto> getAllUsers() {
        return userRepository.findAllWithRoles().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return toDto(user);
    }

    @Transactional
    public UserDto createUser(UserDto userDto) {
        User user = toEntity(userDto);

        if (existsByEmail(userDto.getEmail()).isPresent()) {
            throw new EmailAlreadyExistsException("Email already exists " + userDto.getEmail());
        }

        if (userDto.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }

        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        user.setName(userDto.getName());
        user.setAge(userDto.getAge());

        existsByEmail(userDto.getEmail()).ifPresent(existingUser -> {
            if (!existingUser.getId().equals(id)) {
                throw new EmailAlreadyExistsException("Email for update already exists: " + userDto.getEmail());
            }
        });

        user.setEmail(userDto.getEmail());
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        user.getRoles().clear();
        user.getRoles().addAll(userDto.getRoles().stream()
                .map(rn -> roleRepository.findByName(rn)
                        .orElseThrow(() -> new RoleNotFoundException("Role not found: " + rn)))
                .collect(Collectors.toSet()));

        userRepository.save(user);

        return toDto(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        int deleted = userRepository.deleteUserByIdCustom(id);
        if (deleted == 0) throw new UserNotFoundException(id);
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

    private Optional<User> existsByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
