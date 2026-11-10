(*---
description: A backslash followed by letter a is not a legal escape and the lexer rejects the string.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [strings]
outcome: parse-error
---*)
---- MODULE unknown_escape_a ----
Test == "x\ay" = "z"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 12.  Encountered: "a" (97), after : "\"x\\"
    | Fatal errors while parsing TLA+ spec in file unknown_escape_a
    | In module unknown_escape_a
    | Could not parse module unknown_escape_a from file unknown_escape_a.tla
    | *** Errors: 1
    | In module unknown_escape_a
    | Could not parse module unknown_escape_a from file unknown_escape_a.tla
    3002:1 Parsing or semantic analysis failed.
---*)
