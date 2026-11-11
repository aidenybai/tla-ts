(*---
description: 'An operator whose body is only a literal reaches SortSeq as that value, not an operator, because Spec.lookup returns the tool object of the body. Real TLC bug: the LAMBDA is rejected with "should be a operator", naming 7.'
ref: tlc2/tool/impl/Spec.java#lookup
features:
  - TLC
  - tlc-bug
flags:
  - expression
outcome: evaluation-failure
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 73, col 8 to line 73, col 11 of module sort_literal_body failed.
      2169:0 The second argument of SortSeq should be a boolean function, but instead it is:
      7
  init:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of SortSeq should be a boolean function, but instead it is:
      7
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in sort_literal_body
      1. Line 74, column 29 to line 74, column 32 in sort_literal_body
      2. Line 72, column 9 to line 72, column 49 in sort_literal_body
      3. Line 72, column 9 to line 72, column 42 in sort_literal_body
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of SortSeq should be a boolean function, but instead it is:
      7
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in sort_literal_body
      1. Line 76, column 8 to line 76, column 32 in sort_literal_body
      2. Line 76, column 29 to line 76, column 32 in sort_literal_body
      3. Line 72, column 9 to line 72, column 49 in sort_literal_body
      4. Line 72, column 9 to line 72, column 42 in sort_literal_body
  next:
    exit: 255
    transcript: |-
      2169:1 The second argument of SortSeq should be a boolean function, but instead it is:
      7
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 75, column 9 to line 75, column 33 in sort_literal_body
      1. Line 75, column 30 to line 75, column 33 in sort_literal_body
      2. Line 72, column 9 to line 72, column 49 in sort_literal_body
      3. Line 72, column 9 to line 72, column 42 in sort_literal_body
  property:
    exit: 75
    transcript: |-
      1000:1 
      2169:0 The second argument of SortSeq should be a boolean function, but instead it is:
      7
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 74, column 9 to line 74, column 32 in sort_literal_body
      1. Line 75, column 12 to line 75, column 36 in sort_literal_body
      2. Line 75, column 33 to line 75, column 36 in sort_literal_body
      3. Line 72, column 9 to line 72, column 49 in sort_literal_body
      4. Line 72, column 9 to line 72, column 42 in sort_literal_body
---*)
---- MODULE sort_literal_body ----
EXTENDS TLC, Naturals
Test == SortSeq(<<1, 2>>, LAMBDA x, y : 7) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 73, col 8 to line 73, col 11 of module sort_literal_body failed.
    2169:0 The second argument of SortSeq should be a operator, but instead it is:
    7
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SortSeq should be a operator, but instead it is:
    7
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in sort_literal_body
    1. Line 74, column 29 to line 74, column 32 in sort_literal_body
    2. Line 72, column 9 to line 72, column 49 in sort_literal_body
    3. Line 72, column 9 to line 72, column 42 in sort_literal_body
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of SortSeq should be a operator, but instead it is:
    7
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 75, column 9 to line 75, column 33 in sort_literal_body
    1. Line 75, column 30 to line 75, column 33 in sort_literal_body
    2. Line 72, column 9 to line 72, column 49 in sort_literal_body
    3. Line 72, column 9 to line 72, column 42 in sort_literal_body
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SortSeq should be a operator, but instead it is:
    7
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in sort_literal_body
    1. Line 76, column 8 to line 76, column 32 in sort_literal_body
    2. Line 76, column 29 to line 76, column 32 in sort_literal_body
    3. Line 72, column 9 to line 72, column 49 in sort_literal_body
    4. Line 72, column 9 to line 72, column 42 in sort_literal_body
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of SortSeq should be a operator, but instead it is:
    7
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 74, column 9 to line 74, column 32 in sort_literal_body
    1. Line 75, column 12 to line 75, column 36 in sort_literal_body
    2. Line 75, column 33 to line 75, column 36 in sort_literal_body
    3. Line 72, column 9 to line 72, column 49 in sort_literal_body
    4. Line 72, column 9 to line 72, column 42 in sort_literal_body
---*)
