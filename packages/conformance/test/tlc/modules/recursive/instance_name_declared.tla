(*---
description: An instance name cannot be declared RECURSIVE.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [recursive]
outcome: parse-error
---*)
---- MODULE instance_name_declared ----
---- MODULE I ----
====
RECURSIVE M
M == INSTANCE I
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 11, col 1 to line 11, col 15 of module instance_name_declared
    | Multiply-defined symbol 'M': this definition or declaration conflicts 
    | with the one at line 10, col 11 to line 10, col 11 of module instance_name_declared.
    | line 10, col 11 to line 10, col 11 of module instance_name_declared
    | Symbol M declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
