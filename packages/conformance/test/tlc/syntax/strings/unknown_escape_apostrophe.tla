(*---
description: A backslash followed by quote mark is not a legal escape and the lexer rejects the string.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [strings]
outcome: parse-error
---*)
---- MODULE unknown_escape_apostrophe ----
Test == "x\'y" = "z"
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 12.  Encountered: "\'" (39), after : "\"x\\"
    | Fatal errors while parsing TLA+ spec in file unknown_escape_apostrophe
    | In module unknown_escape_apostrophe
    | Could not parse module unknown_escape_apostrophe from file unknown_escape_apostrophe.tla
    | *** Errors: 1
    | In module unknown_escape_apostrophe
    | Could not parse module unknown_escape_apostrophe from file unknown_escape_apostrophe.tla
    3002:1 Parsing or semantic analysis failed.
---*)
