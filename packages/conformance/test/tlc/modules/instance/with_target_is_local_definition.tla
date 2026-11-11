(*---
description: "WITH may not target a definition, even a LOCAL one."
ref: "tla2sany/semantic/Generator.java#generateSubst"
features: [instance]
outcome: parse-error
---*)
---- MODULE with_target_is_local_definition ----
---- MODULE I ----
LOCAL a == 1
====
INSTANCE I WITH a <- 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 17 to line 11, col 17 of module with_target_is_local_definition
    | Identifier 'a' is not a legal target of a substitution. 
    | A legal target must be a declared CONSTANT or VARIABLE in the module being instantiated. 
    | (Also, check for warnings about multiple declarations of this same identifier.)
    3002:1 Parsing or semantic analysis failed.
---*)
