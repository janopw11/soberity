package com.soberity.identity.token;

public class InvalidTokenException extends Exception {

    public InvalidTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
