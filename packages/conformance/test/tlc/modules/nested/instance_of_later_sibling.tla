(*---
description: "Instancing a later sibling is reported as a redefinition of that sibling, because the monolith fallback extracts it from the root file."
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [nested]
outcome: parse-error
---*)
---- MODULE instance_of_later_sibling ----
---- MODULE J ----
INSTANCE I
====
---- MODULE I ----
A == 8
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 13, col 4 of module instance_of_later_sibling
    | Multiply-defined module 'I': this definition or declaration conflicts 
    | with the one at line 1, col 1 to line 3, col 4 of module I.
    3002:1 Parsing or semantic analysis failed.
---*)
