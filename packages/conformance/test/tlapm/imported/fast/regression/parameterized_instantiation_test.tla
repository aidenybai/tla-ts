(*---
description: tlapm's own test fast/regression/parameterized_instantiation_test.tla.
ref: test/fast/regression/parameterized_instantiation_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
includes:
  - parameterized_instantiation_aux.tla
---*)
----------- MODULE parameterized_instantiation_test -----------------
EXTENDS Integers, FiniteSets

VARIABLE x, z
F(y) == INSTANCE parameterized_instantiation_aux

THEOREM (x = z) => (F(x)!Foo = F(z)!Foo)
BY DEF F!Foo
==========================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:1:18:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:1:18:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./parameterized_instantiation_test.tla", line 11, character 1 to line 19, character 42:
    [INFO]: All 1 obligation proved.
---*)
