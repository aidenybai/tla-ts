(*---
description: "INSTANCE does not bring a module's nested modules."
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [extends]
outcome: parse-error
---*)
---- MODULE instance_does_not_bring_inner_module ----
---- MODULE I ----
---- MODULE J ----
A == 7
====
====
INSTANCE I
INSTANCE J
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 11, col 4 of module instance_does_not_bring_inner_module
    | Multiply-defined module 'J': this definition or declaration conflicts 
    | with the one at line 1, col 1 to line 3, col 4 of module J.
    3002:1 Parsing or semantic analysis failed.
---*)
