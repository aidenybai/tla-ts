(*---
description: SANY reports E4247. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4247_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
This test looks at higher-order operator parameters when given parameters of
indeterminate level. The "apply" function simply applies its second parameter
as the first parameter of the higher-order operator parameter F. There is no
information about the level of x, or the level constraints of F, until they
are actually used. This is in contrast to a case where the argument to F has
known level just from the context of the apply operator itself - for example,
using F(v) instead of F(x) would clearly require F be able to accept a
parameter of variable level or above. Here, cross-checking needs to be done
to see whether the actual value bound to x violates the constraints of the
operator bound to F, at the point of use. In the case below it should trigger
a level-checking error preventing a double-prime expression.
------------ MODULE E4247_Test ------------
VARIABLE v
---- MODULE Inner ----
CONSTANT F(_), x
apply == F(x)
====
INSTANCE Inner WITH F <- ', x <- v'
========================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 25, col 1 to line 25, col 35 of module E4247_Test
    | Error in instantiating module 'Inner':
    |  A non-Leibniz operator substituted for 'F'.
    | line 25, col 1 to line 25, col 35 of module E4247_Test
    | Level error when instantiating module 'Inner':
    | The level of the argument 0 of the operator F' 
    | must be at most 1.
    3002:1 Parsing or semantic analysis failed.
---*)
