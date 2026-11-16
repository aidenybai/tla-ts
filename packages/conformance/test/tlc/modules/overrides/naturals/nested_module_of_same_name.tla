(*---
description: A nested module may not share its name with the replacing file once the file is extended.
ref: "tla2sany/semantic/SymbolTable.java#addModule"
features: [overrides]
includes: [Naturals.tla]
outcome: parse-error
---*)
---- MODULE nested_module_of_same_name ----
EXTENDS Naturals
---- MODULE Naturals ----
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 11, col 4 of module nested_module_of_same_name
    | Multiply-defined module 'Naturals': this definition or declaration conflicts 
    | with the one at line 1, col 1 to line 6, col 4 of module Naturals.
    3002:1 Parsing or semantic analysis failed.
---*)
