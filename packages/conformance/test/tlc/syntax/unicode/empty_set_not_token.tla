(*---
description: ∅ is not a TLA+ token.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
outcome: parse-error
---*)
---- MODULE empty_set_not_token ----
Test == ∅ = {}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 9.  Encountered: "\u2205" (8709), after : ""
    | Fatal errors while parsing TLA+ spec in file empty_set_not_token
    | In module empty_set_not_token
    | Could not parse module empty_set_not_token from file empty_set_not_token.tla
    | *** Errors: 1
    | In module empty_set_not_token
    | Could not parse module empty_set_not_token from file empty_set_not_token.tla
    3002:1 Parsing or semantic analysis failed.
---*)
