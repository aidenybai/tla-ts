(*---
description: ′ is not the prime token.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
outcome: parse-error
---*)
---- MODULE prime_mark_not_token ----
VARIABLE x
A == x′ = x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 9, column 7.  Encountered: "\u2032" (8242), after : ""
    | Fatal errors while parsing TLA+ spec in file prime_mark_not_token
    | In module prime_mark_not_token
    | Could not parse module prime_mark_not_token from file prime_mark_not_token.tla
    | *** Errors: 1
    | In module prime_mark_not_token
    | Could not parse module prime_mark_not_token from file prime_mark_not_token.tla
    3002:1 Parsing or semantic analysis failed.
---*)
