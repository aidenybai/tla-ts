(*---
description: tlapm's own test bugs/instance_mutate_test.tla.
ref: test/bugs/instance_mutate_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
includes:
  - instance_mutate.tla
---*)
---- MODULE instance_mutate_test ----
(*
Instantiation was failing on use of an operator if there was
a Mutation (USE) involved in the instantiated module.
*)
INSTANCE instance_mutate
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0

    File "./instance_mutate_test.tla", line 11, character 1 to line 17, character 4:
    [INFO]: All 0 obligation proved.
---*)
