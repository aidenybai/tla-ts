(*---
description: A parse error in an extended module fails the spec.
ref: "tla2sany/modanalyzer/SpecObj.java#loadSpec"
features: [extends]
includes: [FixBroken.tla]
outcome: parse-error
---*)
---- MODULE broken_module_on_disk ----
EXTENDS FixBroken
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
    | Fatal errors while parsing TLA+ spec in file broken_module_on_disk
    | In module FixBroken
    | Could not parse module FixBroken from file FixBroken.tla
    | *** Errors: 1
    | In module FixBroken
    | Could not parse module FixBroken from file FixBroken.tla
    3002:1 Parsing or semantic analysis failed.
---*)
