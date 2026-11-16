(*---
description: "DOMAIN is reserved, so it cannot be the name of a definition."
ref: tla2sany/parser/TLAplusParserConstants.java
features: [reserved]
outcome: parse-error
---*)
---- MODULE define_domain ----
DOMAIN == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "----"
    | Encountered "Beginning of definition" at line 7, column 27 and token "define_domain" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_domain
    | In module define_domain
    | Could not parse module define_domain from file define_domain.tla
    | *** Errors: 1
    | In module define_domain
    | Could not parse module define_domain from file define_domain.tla
    3002:1 Parsing or semantic analysis failed.
---*)
