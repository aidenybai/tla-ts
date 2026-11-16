(*---
description: A user's Strings.tla is parsed as usual, and tlc2.module.Strings overrides nothing in it.
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - Strings
flags:
  - expression
outcome: success
includes:
  - Strings.tla
---*)
---- MODULE user_module_named_strings ----
EXTENDS Strings
Test == Foo = "a user module named Strings" /\ "a" \in STRING
====

(*--- recorded
all:
  exit: 0
---*)
