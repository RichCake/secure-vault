class UserAlreadyExists(BaseException):
    def __init__(self):
        super().__init__("user already exists")


class UserNotFound(BaseException):
    def __init__(self):
        super().__init__("user not found")


class InvalidCredentials(BaseException):
    def __init__(self):
        super().__init__("invalid credentials")


class SessionExpired(BaseException):
    def __init__(self):
        super().__init__("session expired")
