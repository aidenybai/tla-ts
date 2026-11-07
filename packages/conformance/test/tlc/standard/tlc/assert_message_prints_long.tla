(*---
description: A long message goes through ppr and wraps.
ref: tlc2/module/TLC.java#Assert
features:
  - TLC
flags:
  - expression
contexts:
  - assume
  - init
  - invariant
  - property
outcome: evaluation-failure
---*)
---- MODULE assert_message_prints_long ----
EXTENDS TLC, Naturals
Test == Assert(FALSE, {1000000000 + i : i \in 1..30})
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    { 1000000001,
      1000000002,
      1000000003,
      1000000004,
      1000000005,
      1000000006,
      1000000007,
      1000000008,
      1000000009,
      1000000010,
      1000000011,
      1000000012,
      1000000013,
      1000000014,
      1000000015,
      1000000016,
      1000000017,
      1000000018,
      1000000019,
      1000000020,
      1000000021,
      1000000022,
      1000000023,
      1000000024,
      1000000025,
      1000000026,
      1000000027,
      1000000028,
      1000000029,
      1000000030 }
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    { 1000000001,
      1000000002,
      1000000003,
      1000000004,
      1000000005,
      1000000006,
      1000000007,
      1000000008,
      1000000009,
      1000000010,
      1000000011,
      1000000012,
      1000000013,
      1000000014,
      1000000015,
      1000000016,
      1000000017,
      1000000018,
      1000000019,
      1000000020,
      1000000021,
      1000000022,
      1000000023,
      1000000024,
      1000000025,
      1000000026,
      1000000027,
      1000000028,
      1000000029,
      1000000030 }
init:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    { 1000000001,
      1000000002,
      1000000003,
      1000000004,
      1000000005,
      1000000006,
      1000000007,
      1000000008,
      1000000009,
      1000000010,
      1000000011,
      1000000012,
      1000000013,
      1000000014,
      1000000015,
      1000000016,
      1000000017,
      1000000018,
      1000000019,
      1000000020,
      1000000021,
      1000000022,
      1000000023,
      1000000024,
      1000000025,
      1000000026,
      1000000027,
      1000000028,
      1000000029,
      1000000030 }
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    { 1000000001,
      1000000002,
      1000000003,
      1000000004,
      1000000005,
      1000000006,
      1000000007,
      1000000008,
      1000000009,
      1000000010,
      1000000011,
      1000000012,
      1000000013,
      1000000014,
      1000000015,
      1000000016,
      1000000017,
      1000000018,
      1000000019,
      1000000020,
      1000000021,
      1000000022,
      1000000023,
      1000000024,
      1000000025,
      1000000026,
      1000000027,
      1000000028,
      1000000029,
      1000000030 }
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_message_prints_long
    1. Line 19, column 29 to line 19, column 32 in assert_message_prints_long
    2. Line 17, column 9 to line 17, column 53 in assert_message_prints_long
invariant:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    { 1000000001,
      1000000002,
      1000000003,
      1000000004,
      1000000005,
      1000000006,
      1000000007,
      1000000008,
      1000000009,
      1000000010,
      1000000011,
      1000000012,
      1000000013,
      1000000014,
      1000000015,
      1000000016,
      1000000017,
      1000000018,
      1000000019,
      1000000020,
      1000000021,
      1000000022,
      1000000023,
      1000000024,
      1000000025,
      1000000026,
      1000000027,
      1000000028,
      1000000029,
      1000000030 }
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    { 1000000001,
      1000000002,
      1000000003,
      1000000004,
      1000000005,
      1000000006,
      1000000007,
      1000000008,
      1000000009,
      1000000010,
      1000000011,
      1000000012,
      1000000013,
      1000000014,
      1000000015,
      1000000016,
      1000000017,
      1000000018,
      1000000019,
      1000000020,
      1000000021,
      1000000022,
      1000000023,
      1000000024,
      1000000025,
      1000000026,
      1000000027,
      1000000028,
      1000000029,
      1000000030 }
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_message_prints_long
    1. Line 21, column 8 to line 21, column 32 in assert_message_prints_long
    2. Line 21, column 29 to line 21, column 32 in assert_message_prints_long
    3. Line 17, column 9 to line 17, column 53 in assert_message_prints_long
property:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    { 1000000001,
      1000000002,
      1000000003,
      1000000004,
      1000000005,
      1000000006,
      1000000007,
      1000000008,
      1000000009,
      1000000010,
      1000000011,
      1000000012,
      1000000013,
      1000000014,
      1000000015,
      1000000016,
      1000000017,
      1000000018,
      1000000019,
      1000000020,
      1000000021,
      1000000022,
      1000000023,
      1000000024,
      1000000025,
      1000000026,
      1000000027,
      1000000028,
      1000000029,
      1000000030 }
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    { 1000000001,
      1000000002,
      1000000003,
      1000000004,
      1000000005,
      1000000006,
      1000000007,
      1000000008,
      1000000009,
      1000000010,
      1000000011,
      1000000012,
      1000000013,
      1000000014,
      1000000015,
      1000000016,
      1000000017,
      1000000018,
      1000000019,
      1000000020,
      1000000021,
      1000000022,
      1000000023,
      1000000024,
      1000000025,
      1000000026,
      1000000027,
      1000000028,
      1000000029,
      1000000030 }
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_message_prints_long
    1. Line 20, column 12 to line 20, column 36 in assert_message_prints_long
    2. Line 20, column 33 to line 20, column 36 in assert_message_prints_long
    3. Line 17, column 9 to line 17, column 53 in assert_message_prints_long
---*)
