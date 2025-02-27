const BASE_URL = window.APP_CONFIG.BASE_URL || "http://94.241.171.153:8080" || "http://localhost:8080";
console.log("Backend URL:", BASE_URL);

$(document).ready(function () {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
        console.log('User is authorized');
        $('#register-btn').hide();
        $('#login-btn').hide();
        $('#welcome-message').hide();
        $('#main-content h1').hide();
        $('#current-user').show();
        $('#logout-btn').show();
        $('.add-task-button').show();
        loadUserTasks();
    } else {
        console.log('The user is not authorized');
        $('#register-btn').show();
        $('#login-btn').show();
        $('#main-content h1').show();
        $('#tasks-container').hide();
        $('#current-user').hide();
        $('#logout-btn').hide();
        $('.add-task-button').hide();
    }

    // Открытие модального окна регистрации
    $('#register-btn').click(function () {
        $('#register-modal').modal('show');
    });

    // Открытие модального окна входа
    $('#login-btn').click(function () {
        $('#login-modal').modal('show');
    });

    $('#change-background-btn').on('click', function () {
        $('#background-options').toggle();
    });

    function formatDate(dateString) {
        const options = {day: 'numeric', month: 'short', year: 'numeric'};
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function displayTasks(tasks) {
        const pendingTasksContainer = $('#pending-tasks');
        const completedTasksContainer = $('#completed-tasks');

        pendingTasksContainer.empty();
        completedTasksContainer.empty();

        tasks.forEach(task => {

            const taskItem = `
            <li class="list-group-item ${task.iscompleted ? 'bg-success text-white' : 'bg-warning'}" data-task-id="${task.id}">
                <h5>${task.title}</h5>
                <p>${task.description || ''}</p>
                <button class="btn btn-sm btn-secondary edit-task-btn" data-task-id="${task.id}">Edit</button>
            </li>
        `;

            if (task.iscompleted) {
                completedTasksContainer.append(taskItem);
            } else {
                pendingTasksContainer.append(taskItem);
            }
        });

        $('.edit-task-btn').click(function () {
            const taskId = $(this).data('task-id');
            openEditTaskModal(taskId);
        });

        $('#tasks-list').show();
    }

    $(document).on('contextmenu', '.list-group-item', function (e) {
        e.preventDefault();
        const taskId = $(this).data('task-id');
        $('#task-context-menu').data('task-id', taskId).css({
            top: e.pageY + 'px',
            left: e.pageX + 'px'
        }).show();
    });

    $(document).click(function () {
        $('#task-context-menu').hide();
    });

    $('#context-open-task').click(function () {
        const taskId = $('#task-context-menu').data('task-id');
        openViewTaskModal(taskId);
    });

    $('#context-edit-task').click(function () {
        const taskId = $('#task-context-menu').data('task-id');
        openEditTaskModal(taskId);
    });

    $('#context-delete-task').click(function () {
        const taskId = $('#task-context-menu').data('task-id');
        deleteTask(taskId);
    });

    function openViewTaskModal(taskId) {
        const accessToken = localStorage.getItem('accessToken');
        $.ajax({
            url: `${BASE_URL}/api/v1/task/${taskId}`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            success: function (task) {
                $('#view-task-title').text(task.title);
                $('#view-task-description').text(task.description);

                // Форматируем даты для отображения в модальном окне
                const formattedCreatedAt = formatDate(task.createdAt);
                const formattedCompletedAt = task.completedAt ? formatDate(task.completedAt) : '';
                $('#view-task-dates').html(`Created At: ${formattedCreatedAt}<br>${task.iscompleted ? `Completed At: ${formattedCompletedAt}` : ''}`);

                $('#delete-task-btn').data('task-id', task.id);
                $('#view-task-modal').modal('show');
            },
            error: function () {
                alert('Failed to load task data');
            }
        });
    }

    // Удаление задачи
    $('#delete-task-btn').click(function () {
        const taskId = $(this).data('task-id');
        deleteTask(taskId);
    });

    function deleteTask(taskId) {
        const accessToken = localStorage.getItem('accessToken');
        $.ajax({
            url: `${BASE_URL}/api/v1/task/${taskId}/delete`,
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            success: function () {
                alert('The task was successfully deleted');
                $('#view-task-modal').modal('hide');
                loadUserTasks(); // Обновить список задач после удаления
            },
            error: function () {
                alert('Failed to delete task');
            }
        });
    }

    function openEditTaskModal(taskId) {
        const accessToken = localStorage.getItem('accessToken');
        $.ajax({
            url: `${BASE_URL}/api/v1/task/${taskId}`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            success: function (task) {
                $('#edit-task-title').val(task.title);
                $('#edit-task-description').val(task.description);
                $('#edit-task-iscompleted').prop('checked', task.iscompleted);
                $('#save-task-btn').data('task-id', task.id);
                $('#edit-task-modal').modal('show');
            },
            error: function () {
                alert('Failed to load task data');
            }
        });
    }


    $('#save-task-btn').click(function () {
        const taskId = $(this).data('task-id');
        const updatedTitle = $('#edit-task-title').val();
        const updatedDescription = $('#edit-task-description').val();
        const updatedIsCompleted = $('#edit-task-iscompleted').is(':checked');
        const accessToken = localStorage.getItem('accessToken');

        const updatedTaskData = {
            title: updatedTitle,
            description: updatedDescription,
            iscompleted: updatedIsCompleted
        };

        $('#edit-task-title-error').hide();

        $.ajax({
            url: `${BASE_URL}/api/v1/task/${taskId}/update`,
            method: 'PATCH',
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: JSON.stringify(updatedTaskData),
            success: function () {
                alert('Task updated successfully!');
                $('#edit-task-modal').modal('hide');
                loadUserTasks();
            },
            error: function (xhr) {
                if (xhr.status === 409 && xhr.responseJSON && xhr.responseJSON.message === "Task with this title already exists for this user") {
                    $('#edit-task-title-error').text('Task with this title already exists').show();
                } else {
                    alert('Failed to update task');
                }
            }
        });
    });


    // Для загрузки задач
    function loadUserTasks() {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error('Access token is missing');
            return;
        }

        $.ajax({
            url: `${BASE_URL}/api/v1/tasks`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            success: function (response) {
                displayTasks(response);
            },
            error: function () {
                alert('Failed to load tasks');
            }
        });
    }

    // Обработка регистрации
    $('#register-form').on('submit', function (event) {
        event.preventDefault();
        const username = $('input[name="register-username"]').val();
        const email = $('input[name="register-email"]').val();
        const password = $('input[name="register-password"]').val();
        const repeatPassword = $('input[name="register-repeat-password"]').val();

        if (password !== repeatPassword) {
            $('#register-error').text('Passwords do not match').show();
            return;
        }

        const requestData = {
            username: username,
            email: email,
            password: password,
            confirmPassword: repeatPassword
        };

        $.ajax({
            url: `${BASE_URL}/api/v1/auth/signup`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function (response) {
                const accessToken = response.accessToken;
                const refreshToken = response.refreshToken;

                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                alert('Registration successful!');
                $('#user-email').text(email);
                $('#current-user').show();
                $('#main-content h1').hide();
                $('#logout-btn').show();
                $('#login-modal').modal('hide');
                $('#register-modal').modal('hide');
                $('#register-btn').hide();
                $('#login-btn').hide();
                $('#welcome-message').hide();
                $('#tasks-container').show();
                $('.add-task-button').show();
                loadUserTasks();
            },
            error: function (response) {
                $('#register-error').text(response.responseText).show();
            }
        });
    });

    // Обработка входаа
    $('#login-form').on('submit', function (event) {
        event.preventDefault();
        const email = $('input[name="login-email"]').val();
        const password = $('input[name="login-password"]').val();

        $.ajax({
            url: `${BASE_URL}/api/v1/auth/signin`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({email: email, password: password}),
            success: function (response) {
                const accessToken = response.accessToken;
                const refreshToken = response.refreshToken;

                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                $('#user-email').text(email);
                $('#current-user').show();
                $('#main-content h1').hide();
                $('#logout-btn').show();
                $('#login-modal').modal('hide');
                $('#register-btn').hide();
                $('#login-btn').hide();
                $('#welcome-message').hide();
                $('#tasks-container').show();
                $('.add-task-button').show();

                loadUserTasks();
            },
            error: function (response) {
                $('#login-error').text(response.responseText).show();
            }
        });
    });
    $(".task-list").sortable({
        connectWith: ".task-list",
        placeholder: "ui-state-highlight",
        tolerance: "pointer",
        update: function (event, ui) {
            const taskId = ui.item.data('task-id');
            const isCompleted = $(ui.item).parent().attr('id') === 'completed-tasks';

            // Получить текущую задачу с сервера
            $.ajax({
                url: `${BASE_URL}/api/v1/task/${taskId}`,
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                },
                success: function (task) {
                    // Отправка запроса на сервер для обновления статуса задачи с заполненным заголовком
                    $.ajax({
                        url: `${BASE_URL}/api/v1/task/${taskId}/update`,
                        method: 'PATCH',
                        contentType: 'application/json',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                        },
                        data: JSON.stringify({
                            title: task.title,
                            description: task.description,
                            iscompleted: isCompleted
                        }),
                        success: function () {
                            if (isCompleted) {
                                ui.item.removeClass('pending-task').addClass('completed-task');
                            } else {
                                ui.item.removeClass('completed-task').addClass('pending-task');
                            }
                            console.log('Task status updated successfully');
                        },
                        error: function () {
                            alert('Failed to update task status');
                            loadUserTasks();
                        }
                    });
                },
                error: function () {
                    alert('Failed to retrieve task data');
                }
            });
        }
    }).disableSelection();


    // Открыть модальное окно при нажатии кнопки "Добавить задачу"
    $('.add-task-button').click(function () {
        $('#add-task-modal').modal('show');
        $('#task-title-error').hide();
    });

    // Обработка формы добавления задачи
    $('#add-task-form').submit(function (event) {
        event.preventDefault();

        const title = $('#task-title').val();
        const description = $('#task-description').val();
        const accessToken = localStorage.getItem('accessToken');

        // Отправить запрос на создание задачи
        $.ajax({
            url: `${BASE_URL}/api/v1/tasks`,
            method: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            },
            data: JSON.stringify({
                title: title,
                description: description
            }),
            success: function (response) {
                alert('The task has been created successfully');
                $('#add-task-modal').modal('hide');
                loadUserTasks();
            },
            error: function (xhr) {
                // Проверяем код ошибки
                if (xhr.status === 409 && xhr.responseJSON && xhr.responseJSON.message === "Task with this title already exists for this user") {
                    $('#task-title-error').text('Task with this title already exists').show();
                } else {
                    alert('Failed to create task');
                }
            }
            // error: function() {
            //     alert('Failed to create task');
            // }
        });
    });

    // Обработка выхода
    $('#logout-btn').click(function () {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        $('#current-user').hide();
        $('#logout-btn').hide();
        $('#tasks-container').hide();
        $('#register-btn').show();
        $('#login-btn').show();
        $('#main-content h1').show();
        $('.add-task-button').hide();
        alert('Logged out successfully');
    });
});