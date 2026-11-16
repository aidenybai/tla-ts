(*---
description: INSTANCE needs an identifier.
ref: "tla2sany/parser/TLAplusParser.java#Instantiation"
features: [instance]
outcome: parse-error
---*)
---- MODULE instance_number_name ----
INSTANCE 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "INSTANCE 1" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file instance_number_name
    | In module instance_number_name
    | Could not parse module instance_number_name from file instance_number_name.tla
    | *** Errors: 1
    | In module instance_number_name
    | Could not parse module instance_number_name from file instance_number_name.tla
    3002:1 Parsing or semantic analysis failed.
---*)
