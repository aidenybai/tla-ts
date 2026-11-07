(*---
description: An untyped model value compares with an integer key, so it joins.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - TLC
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE at_at_mixed_key_types_model_value ----
EXTENDS TLC, Naturals
CONSTANT mv
Test == ((1 :> "x") @@ (mv :> "y"))[mv] = "y"
====

(*--- recorded
all:
  exit: 0
---*)
