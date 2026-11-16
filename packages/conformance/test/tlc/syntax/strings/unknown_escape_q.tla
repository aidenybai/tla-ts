(*---
description: A backslash followed by letter q is not a legal escape and the lexer rejects the string.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [strings]
outcome: parse-error
---*)
---- MODULE unknown_escape_q ----
Test == "x\qy" = "z"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 12.  Encountered: "q" (113), after : "\"x\\"
    | Fatal errors while parsing TLA+ spec in file unknown_escape_q
    | In module unknown_escape_q
    | Could not parse module unknown_escape_q from file unknown_escape_q.tla
    | *** Errors: 1
    | In module unknown_escape_q
    | Could not parse module unknown_escape_q from file unknown_escape_q.tla
    3002:1 Parsing or semantic analysis failed.
---*)
