(*---
description: "A module ASSUME takes an expression, and ASSUME/PROVE is not one."
ref: "tla2sany/parser/TLAplusParser.java#Assumption"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE assume_prove_module_level ----
ASSUME ASSUME TRUE PROVE TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "ASSUME ASSUME" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file assume_prove_module_level
    | In module assume_prove_module_level
    | Could not parse module assume_prove_module_level from file assume_prove_module_level.tla
    | *** Errors: 1
    | In module assume_prove_module_level
    | Could not parse module assume_prove_module_level from file assume_prove_module_level.tla
    3002:1 Parsing or semantic analysis failed.
---*)
