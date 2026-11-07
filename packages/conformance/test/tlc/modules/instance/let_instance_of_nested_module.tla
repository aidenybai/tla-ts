(*---
description: "A LET INSTANCE of a nested module draws a false module redefinition error, since the dependency scan treats it as external and the monolith fallback extracts the nested module a second time."
ref: "tla2sany/modanalyzer/ParseUnit.java#getInstances"
features: [instance, tlc-bug]
outcome: parse-error
---*)
---- MODULE let_instance_of_nested_module ----
---- MODULE I ----
A == 1
====
Test == LET M == INSTANCE I IN M!A = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 1 to line 10, col 4 of module let_instance_of_nested_module
    | Multiply-defined module 'I': this definition or declaration conflicts 
    | with the one at line 1, col 1 to line 3, col 4 of module I.
    3002:1 Parsing or semantic analysis failed.
---*)
