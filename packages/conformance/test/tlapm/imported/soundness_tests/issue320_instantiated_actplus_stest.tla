(*---
description: 'tlapm''s soundness test issue320_instantiated_actplus_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/320.'
ref: test/soundness_tests/issue320_instantiated_actplus_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue320_instantiated_actplus_stest --------------

\* https://github.com/tlaplus/tlapm/issues/320
\* Instantiation does not distribute over -+-> (Specifying Systems,
\* Section 17.8), but tlapm substitutes into its arguments.  In Inner, every
\* prefix can be extended to satisfy <>(x # y) but none to satisfy FALSE, so
\* P equals FALSE, and so does I!P.  With x <- z, y <- z, <>(z # z) -+-> FALSE
\* equals TRUE, so the theorem is false.

EXTENDS TLAPS

VARIABLE z

---- MODULE Inner ----
VARIABLES x, y
P == <>(x # y) -+-> FALSE
====

I == INSTANCE Inner WITH x <- z, y <- z

THEOREM I!P <=> (<>(z # z) -+-> FALSE)
BY PTL DEF I!P

==============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 31:1:31:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 31:1:31:3
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 31:4:31:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 31:4:31:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 2

    File "./issue320_instantiated_actplus_stest.tla", line 23, character 1 to line 26, character 4:
    [INFO]: All 0 obligation proved.
    File "./issue320_instantiated_actplus_stest.tla", line 10, character 1 to line 33, character 78:
    [INFO]: All 2 obligations proved.
---*)
