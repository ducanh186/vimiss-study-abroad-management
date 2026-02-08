# Backend Routes

## Auth Routes (web.php) — No Sanctum guard

| Method | URI                        | Controller@method                    | Middleware                    |
|--------|----------------------------|--------------------------------------|-------------------------------|
| POST   | `/login`                   | AuthController@login                 | throttle:login                |
| POST   | `/logout`                  | AuthController@logout                | auth:sanctum                  |
| POST   | `/register/request-code`   | AuthController@registerRequestCode   | throttle:register-request-code|
| POST   | `/register`                | AuthController@register              | throttle:register             |
| POST   | `/forgot-password/request` | AuthController@forgotPasswordRequest | throttle:forgot-password-request |
| POST   | `/forgot-password/reset`   | AuthController@forgotPasswordReset   | throttle:forgot-password-reset   |
| GET    | `/{any}`                   | → spa.blade.php (catch-all)          | —                             |

## API Routes (api.php) — Sanctum + must_change_password

| Method | URI                    | Controller@method            | Middleware / Notes              |
|--------|------------------------|------------------------------|---------------------------------|
| GET    | `/api/me`              | AuthController@me            | auth:sanctum, must_change_password |
| POST   | `/api/change-password` | AuthController@changePassword| auth:sanctum, must_change_password |
| GET    | `/api/profile`         | ProfileController@show       | auth:sanctum, must_change_password |
| PUT    | `/api/profile`         | ProfileController@update     | auth:sanctum, must_change_password |
| GET    | `/api/users`           | UserController@index         | role:admin                      |
| POST   | `/api/users`           | UserController@store         | role:admin                      |
| GET    | `/api/users/{id}`      | UserController@show          | role:admin                      |
| PATCH  | `/api/users/{id}/role` | UserController@updateRole    | role:admin                      |
| DELETE | `/api/users/{id}`      | UserController@destroy       | role:admin                      |
| GET    | `/api/roles`           | UserController@roles         | role:admin                      |
| GET    | `/api/health`          | (closure)                    | public                          |

## Rate Limiters (AppServiceProvider)

| Name                     | Limit                                     |
|--------------------------|-------------------------------------------|
| `login`                  | 5/min per IP+email                        |
| `register-request-code`  | 3/min per IP + 1/min per email            |
| `register`               | 5/min per IP                              |
| `forgot-password-request`| 3/min per IP + 1/min per email            |
| `forgot-password-reset`  | 5/min per IP + 5/min per email            |
