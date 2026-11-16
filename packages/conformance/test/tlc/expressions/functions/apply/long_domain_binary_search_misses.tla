(*---
description: "Binary search on a long domain reports a missing integer the same way as a linear search."
ref: "tlc2/value/impl/FcnRcdValue.java#selectBinarySearch"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE long_domain_binary_search_misses ----
EXTENDS Integers
F == [x \in {y * 2 : y \in 1..40} |-> x]
Test == F[3] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module long_domain_binary_search_misses failed.
    Attempted to apply function:
    ( 2 :> 2 @@
      4 :> 4 @@
      6 :> 6 @@
      8 :> 8 @@
      10 :> 10 @@
      12 :> 12 @@
      14 :> 14 @@
      16 :> 16 @@
      18 :> 18 @@
      20 :> 20 @@
      22 :> 22 @@
      24 :> 24 @@
      26 :> 26 @@
      28 :> 28 @@
      30 :> 30 @@
      32 :> 32 @@
      34 :> 34 @@
      36 :> 36 @@
      38 :> 38 @@
      40 :> 40 @@
      42 :> 42 @@
      44 :> 44 @@
      46 :> 46 @@
      48 :> 48 @@
      50 :> 50 @@
      52 :> 52 @@
      54 :> 54 @@
      56 :> 56 @@
      58 :> 58 @@
      60 :> 60 @@
      62 :> 62 @@
      64 :> 64 @@
      66 :> 66 @@
      68 :> 68 @@
      70 :> 70 @@
      72 :> 72 @@
      74 :> 74 @@
      76 :> 76 @@
      78 :> 78 @@
      80 :> 80 )
    to argument 3, which is not in the domain of the function.
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to apply function:
    ( 2 :> 2 @@
      4 :> 4 @@
      6 :> 6 @@
      8 :> 8 @@
      10 :> 10 @@
      12 :> 12 @@
      14 :> 14 @@
      16 :> 16 @@
      18 :> 18 @@
      20 :> 20 @@
      22 :> 22 @@
      24 :> 24 @@
      26 :> 26 @@
      28 :> 28 @@
      30 :> 30 @@
      32 :> 32 @@
      34 :> 34 @@
      36 :> 36 @@
      38 :> 38 @@
      40 :> 40 @@
      42 :> 42 @@
      44 :> 44 @@
      46 :> 46 @@
      48 :> 48 @@
      50 :> 50 @@
      52 :> 52 @@
      54 :> 54 @@
      56 :> 56 @@
      58 :> 58 @@
      60 :> 60 @@
      62 :> 62 @@
      64 :> 64 @@
      66 :> 66 @@
      68 :> 68 @@
      70 :> 70 @@
      72 :> 72 @@
      74 :> 74 @@
      76 :> 76 @@
      78 :> 78 @@
      80 :> 80 )
    to argument 3, which is not in the domain of the function.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in long_domain_binary_search_misses
    1. Line 12, column 29 to line 12, column 32 in long_domain_binary_search_misses
    2. Line 10, column 9 to line 10, column 16 in long_domain_binary_search_misses
    3. Line 10, column 9 to line 10, column 12 in long_domain_binary_search_misses
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to apply function:
    ( 2 :> 2 @@
      4 :> 4 @@
      6 :> 6 @@
      8 :> 8 @@
      10 :> 10 @@
      12 :> 12 @@
      14 :> 14 @@
      16 :> 16 @@
      18 :> 18 @@
      20 :> 20 @@
      22 :> 22 @@
      24 :> 24 @@
      26 :> 26 @@
      28 :> 28 @@
      30 :> 30 @@
      32 :> 32 @@
      34 :> 34 @@
      36 :> 36 @@
      38 :> 38 @@
      40 :> 40 @@
      42 :> 42 @@
      44 :> 44 @@
      46 :> 46 @@
      48 :> 48 @@
      50 :> 50 @@
      52 :> 52 @@
      54 :> 54 @@
      56 :> 56 @@
      58 :> 58 @@
      60 :> 60 @@
      62 :> 62 @@
      64 :> 64 @@
      66 :> 66 @@
      68 :> 68 @@
      70 :> 70 @@
      72 :> 72 @@
      74 :> 74 @@
      76 :> 76 @@
      78 :> 78 @@
      80 :> 80 )
    to argument 3, which is not in the domain of the function.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in long_domain_binary_search_misses
    1. Line 13, column 30 to line 13, column 33 in long_domain_binary_search_misses
    2. Line 10, column 9 to line 10, column 16 in long_domain_binary_search_misses
    3. Line 10, column 9 to line 10, column 12 in long_domain_binary_search_misses
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function:
    ( 2 :> 2 @@
      4 :> 4 @@
      6 :> 6 @@
      8 :> 8 @@
      10 :> 10 @@
      12 :> 12 @@
      14 :> 14 @@
      16 :> 16 @@
      18 :> 18 @@
      20 :> 20 @@
      22 :> 22 @@
      24 :> 24 @@
      26 :> 26 @@
      28 :> 28 @@
      30 :> 30 @@
      32 :> 32 @@
      34 :> 34 @@
      36 :> 36 @@
      38 :> 38 @@
      40 :> 40 @@
      42 :> 42 @@
      44 :> 44 @@
      46 :> 46 @@
      48 :> 48 @@
      50 :> 50 @@
      52 :> 52 @@
      54 :> 54 @@
      56 :> 56 @@
      58 :> 58 @@
      60 :> 60 @@
      62 :> 62 @@
      64 :> 64 @@
      66 :> 66 @@
      68 :> 68 @@
      70 :> 70 @@
      72 :> 72 @@
      74 :> 74 @@
      76 :> 76 @@
      78 :> 78 @@
      80 :> 80 )
    to argument 3, which is not in the domain of the function.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in long_domain_binary_search_misses
    1. Line 14, column 8 to line 14, column 32 in long_domain_binary_search_misses
    2. Line 14, column 29 to line 14, column 32 in long_domain_binary_search_misses
    3. Line 10, column 9 to line 10, column 16 in long_domain_binary_search_misses
    4. Line 10, column 9 to line 10, column 12 in long_domain_binary_search_misses
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to apply function:
    ( 2 :> 2 @@
      4 :> 4 @@
      6 :> 6 @@
      8 :> 8 @@
      10 :> 10 @@
      12 :> 12 @@
      14 :> 14 @@
      16 :> 16 @@
      18 :> 18 @@
      20 :> 20 @@
      22 :> 22 @@
      24 :> 24 @@
      26 :> 26 @@
      28 :> 28 @@
      30 :> 30 @@
      32 :> 32 @@
      34 :> 34 @@
      36 :> 36 @@
      38 :> 38 @@
      40 :> 40 @@
      42 :> 42 @@
      44 :> 44 @@
      46 :> 46 @@
      48 :> 48 @@
      50 :> 50 @@
      52 :> 52 @@
      54 :> 54 @@
      56 :> 56 @@
      58 :> 58 @@
      60 :> 60 @@
      62 :> 62 @@
      64 :> 64 @@
      66 :> 66 @@
      68 :> 68 @@
      70 :> 70 @@
      72 :> 72 @@
      74 :> 74 @@
      76 :> 76 @@
      78 :> 78 @@
      80 :> 80 )
    to argument 3, which is not in the domain of the function.
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in long_domain_binary_search_misses
    1. Line 13, column 12 to line 13, column 36 in long_domain_binary_search_misses
    2. Line 13, column 33 to line 13, column 36 in long_domain_binary_search_misses
    3. Line 10, column 9 to line 10, column 16 in long_domain_binary_search_misses
    4. Line 10, column 9 to line 10, column 12 in long_domain_binary_search_misses
---*)
