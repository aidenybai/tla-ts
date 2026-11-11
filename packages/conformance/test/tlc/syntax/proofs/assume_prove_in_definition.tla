(*---
description: ASSUME/PROVE is not an expression.
ref: "tla2sany/parser/TLAplusParser.java#Expression"
features: [proofs]
outcome: parse-error
---*)
---- MODULE assume_prove_in_definition ----
A == ASSUME TRUE PROVE TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Expression or Instance"
    | Encountered "ASSUME" at line 8, column 6 and token "==" 
    | Residual stack trace follows:
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file assume_prove_in_definition
    | In module assume_prove_in_definition
    | Could not parse module assume_prove_in_definition from file assume_prove_in_definition.tla
    | *** Errors: 1
    | In module assume_prove_in_definition
    | Could not parse module assume_prove_in_definition from file assume_prove_in_definition.tla
    3002:1 Parsing or semantic analysis failed.
---*)
