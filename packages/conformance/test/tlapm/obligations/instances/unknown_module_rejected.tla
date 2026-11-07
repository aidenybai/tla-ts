(*---
description: INSTANCE of a module that cannot be found is rejected.
ref: src/module/m_elab.ml#assert_module_exists
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_module_rejected ----
I == INSTANCE NoSuchModule
THEOREM TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_module_rejected.tla", line 8, characters 3-26

    Unknown module "NoSuchModule"

    File "./unknown_module_rejected.tla", line 8, characters 3-26:
    Error: Unknown module "NoSuchModule"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
