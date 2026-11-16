(*---
description: Trace in ASSUME has no variables to wait for, and yields a one-record trace.
ref: tlc2/module/TLCExt.java#getTrace
features:
  - TLCExt
flags:
  - expression
contexts:
  - assume
outcome: success
---*)
---- MODULE trace_assume ----
EXTENDS TLCExt, TLC, Naturals
Test == Print(Trace, TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<[]>>  TRUE"
---*)
