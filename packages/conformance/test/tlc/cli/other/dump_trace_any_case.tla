(*---
description: -dumpTrace and its format compare with equalsIgnoreCase.
ref: tlc2/TLC.java#handleParameters
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -DUMPTRACE
  - JSON
  - trace.json
files:
  - trace.json
---*)
---- MODULE dump_trace_any_case ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 20, col 9 to line 20, col 24 of module dump_trace_any_case>
    x = 1
    2217:4 3: <Next line 20, col 9 to line 20, col 24 of module dump_trace_any_case>
    x = 2
    | "CounterExample written: trace.json"
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
  files:
    trace.json: '{"counterexample":{"action":[[[1,{"x":0}],{"name":"Next","location":{"beginLine":20,"beginColumn":9,"endLine":20,"endColumn":24,"module":"dump_trace_any_case"}},[2,{"x":1}]],[[2,{"x":1}],{"name":"Next","location":{"beginLine":20,"beginColumn":9,"endLine":20,"endColumn":24,"module":"dump_trace_any_case"}},[3,{"x":2}]]],"state":[[1,{"x":0}],[2,{"x":1}],[3,{"x":2}]]},"vars":["x"]}'
---*)
