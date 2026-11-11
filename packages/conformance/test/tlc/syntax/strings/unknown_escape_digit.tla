(*---
description: A backslash followed by digit is not a legal escape and the lexer rejects the string.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [strings]
outcome: parse-error
---*)
---- MODULE unknown_escape_digit ----
Test == "x\0y" = "z"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 12.  Encountered: "0" (48), after : "\"x\\"
    | Fatal errors while parsing TLA+ spec in file unknown_escape_digit
    | In module unknown_escape_digit
    | Could not parse module unknown_escape_digit from file unknown_escape_digit.tla
    | *** Errors: 1
    | In module unknown_escape_digit
    | Could not parse module unknown_escape_digit from file unknown_escape_digit.tla
    3002:1 Parsing or semantic analysis failed.
---*)
