(*---
description: λ is not LAMBDA or a name character.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [unicode]
outcome: parse-error
---*)
---- MODULE lambda_not_token ----
Test == λ
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Lexical error at line 8, column 9.  Encountered: "\u03bb" (955), after : ""
    | Fatal errors while parsing TLA+ spec in file lambda_not_token
    | In module lambda_not_token
    | Could not parse module lambda_not_token from file lambda_not_token.tla
    | *** Errors: 1
    | In module lambda_not_token
    | Could not parse module lambda_not_token from file lambda_not_token.tla
    3002:1 Parsing or semantic analysis failed.
---*)
