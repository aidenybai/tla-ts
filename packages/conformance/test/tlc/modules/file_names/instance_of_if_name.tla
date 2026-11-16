(*---
description: "INSTANCE does not take IF as a module name, even with a nested module of that name."
ref: "tla2sany/parser/TLAplusParser.java#Instantiation"
features: [file_names]
outcome: parse-error
---*)
---- MODULE instance_of_if_name ----
---- MODULE IF ----
A == 1
====
INSTANCE IF
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "INSTANCE IF" at line 11, column 1 and token "====" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file instance_of_if_name
    | In module instance_of_if_name
    | Could not parse module instance_of_if_name from file instance_of_if_name.tla
    | *** Errors: 1
    | In module instance_of_if_name
    | Could not parse module instance_of_if_name from file instance_of_if_name.tla
    3002:1 Parsing or semantic analysis failed.
---*)
