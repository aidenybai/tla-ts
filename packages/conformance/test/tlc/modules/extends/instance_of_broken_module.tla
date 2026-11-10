(*---
description: A parse error in an instanced module fails the spec.
ref: "tla2sany/modanalyzer/SpecObj.java#loadSpec"
features: [extends]
includes: [FixBroken.tla]
outcome: parse-error
---*)
---- MODULE instance_of_broken_module ----
INSTANCE FixBroken
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "This" at line 2, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 1, column 1.
    | Fatal errors while parsing TLA+ spec in file instance_of_broken_module
    | In module FixBroken
    | Could not parse module FixBroken from file FixBroken.tla
    | *** Errors: 1
    | In module FixBroken
    | Could not parse module FixBroken from file FixBroken.tla
    3002:1 Parsing or semantic analysis failed.
---*)
