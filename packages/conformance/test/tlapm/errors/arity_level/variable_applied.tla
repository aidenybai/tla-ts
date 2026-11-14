(*---
description: "A variable applied to an argument crashes tlapm with an assertion failure instead of an error: anons asserts that a Flex has no arguments (src/expr/e_anon.ml#anons, line 224)."
ref: src/expr/e_anon.ml#anons
features: [tlapm-bug]
mode: obligations
outcome: rejected
---*)
---- MODULE variable_applied ----
VARIABLE x
THEOREM x(1) = 1 OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: error
    @url: http://tla.msr-inria.inria.fr/bugs
    @msg: Oops, this seems to be a bug in TLAPM.
    Please give feedback to developers.


     File "src/expr/e_anon.ml", line 224, characters 24-30: Assertion failed

     tlapm ending abnormally with File "src/expr/e_anon.ml", line 224, characters 24-30: Assertion failed
---*)
