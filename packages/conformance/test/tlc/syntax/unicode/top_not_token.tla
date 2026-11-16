(*---
description: ⊤ is not a TLA+ token.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
outcome: parse-error
---*)
---- MODULE top_not_token ----
Test == ⊤
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 9.  Encountered: "\u22a4" (8868), after : ""
    | Fatal errors while parsing TLA+ spec in file top_not_token
    | In module top_not_token
    | Could not parse module top_not_token from file top_not_token.tla
    | *** Errors: 1
    | In module top_not_token
    | Could not parse module top_not_token from file top_not_token.tla
    3002:1 Parsing or semantic analysis failed.
---*)
