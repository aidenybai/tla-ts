(*---
description: "A LET-bound function over an enumerable domain that is not applied gets fully evaluated."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE let_function_eager_when_compared ----
EXTENDS Integers
Test == LET f == [x \in 1..2 |-> IF x = 1 THEN 7 ELSE 1 \div 0] IN f # <<7>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module let_function_eager_when_compared failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in let_function_eager_when_compared
    1. Line 11, column 29 to line 11, column 32 in let_function_eager_when_compared
    2. Line 9, column 9 to line 9, column 76 in let_function_eager_when_compared
    3. Line 9, column 68 to line 9, column 76 in let_function_eager_when_compared
    4. Line 9, column 68 to line 9, column 68 in let_function_eager_when_compared
    5. Line 9, column 18 to line 9, column 63 in let_function_eager_when_compared
    6. Line 9, column 34 to line 9, column 62 in let_function_eager_when_compared
    7. Line 9, column 55 to line 9, column 62 in let_function_eager_when_compared


    Reason:
    2179:0 The second argument of \div is 0.
next:
  exit: 75
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in let_function_eager_when_compared
    1. Line 12, column 30 to line 12, column 33 in let_function_eager_when_compared
    2. Line 9, column 9 to line 9, column 76 in let_function_eager_when_compared
    3. Line 9, column 68 to line 9, column 76 in let_function_eager_when_compared
    4. Line 9, column 68 to line 9, column 68 in let_function_eager_when_compared
    5. Line 9, column 18 to line 9, column 63 in let_function_eager_when_compared
    6. Line 9, column 34 to line 9, column 62 in let_function_eager_when_compared
    7. Line 9, column 55 to line 9, column 62 in let_function_eager_when_compared


    Reason:
    2179:0 The second argument of \div is 0.
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in let_function_eager_when_compared
    1. Line 13, column 8 to line 13, column 32 in let_function_eager_when_compared
    2. Line 13, column 29 to line 13, column 32 in let_function_eager_when_compared
    3. Line 9, column 9 to line 9, column 76 in let_function_eager_when_compared
    4. Line 9, column 68 to line 9, column 76 in let_function_eager_when_compared
    5. Line 9, column 68 to line 9, column 68 in let_function_eager_when_compared
    6. Line 9, column 18 to line 9, column 63 in let_function_eager_when_compared
    7. Line 9, column 34 to line 9, column 62 in let_function_eager_when_compared
    8. Line 9, column 55 to line 9, column 62 in let_function_eager_when_compared


    Reason:
    2179:0 The second argument of \div is 0.
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in let_function_eager_when_compared
    1. Line 12, column 12 to line 12, column 36 in let_function_eager_when_compared
    2. Line 12, column 33 to line 12, column 36 in let_function_eager_when_compared
    3. Line 9, column 9 to line 9, column 76 in let_function_eager_when_compared
    4. Line 9, column 68 to line 9, column 76 in let_function_eager_when_compared
    5. Line 9, column 68 to line 9, column 68 in let_function_eager_when_compared
    6. Line 9, column 18 to line 9, column 63 in let_function_eager_when_compared
    7. Line 9, column 34 to line 9, column 62 in let_function_eager_when_compared
    8. Line 9, column 55 to line 9, column 62 in let_function_eager_when_compared


    Reason:
    2179:0 The second argument of \div is 0.
---*)
