(*---
description: INSTANCE needs a name.
ref: "tla2sany/parser/TLAplusParser.java#Instantiation"
features: [instance]
outcome: parse-error
---*)
---- MODULE instance_needs_name_token ----
INSTANCE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "INSTANCE ====" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file instance_needs_name_token
    | In module instance_needs_name_token
    | Could not parse module instance_needs_name_token from file instance_needs_name_token.tla
    | *** Errors: 1
    | In module instance_needs_name_token
    | Could not parse module instance_needs_name_token from file instance_needs_name_token.tla
    3002:1 Parsing or semantic analysis failed.
---*)
