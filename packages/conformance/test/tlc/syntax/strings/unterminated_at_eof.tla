(*---
description: A string open at the end of the file is a lexical error.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [strings]
outcome: parse-error
---*)
---- MODULE unterminated_at_eof ----
Test == "abc

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 9, column 0.  Encountered: <EOF> after : "\"abc\n"
    | Fatal errors while parsing TLA+ spec in file unterminated_at_eof
    | In module unterminated_at_eof
    | Could not parse module unterminated_at_eof from file unterminated_at_eof.tla
    | *** Errors: 1
    | In module unterminated_at_eof
    | Could not parse module unterminated_at_eof from file unterminated_at_eof.tla
    3002:1 Parsing or semantic analysis failed.
---*)
