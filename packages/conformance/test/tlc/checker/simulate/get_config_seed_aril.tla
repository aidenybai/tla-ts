(*---
description: 'TLCGet("config") reports the seed and aril as strings, but its aril is "0" under -aril 2 while the summary prints 2. This is a TLC bug: Simulator builds the config record in its constructor, before it reads the aril from the generator.'
ref: tlc2/tool/Simulator.java#createConfig
features:
  - tlc-bug
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "1"
  - -aril
  - "2"
correct:
  all:
    exit: 0
    transcript: |-
      2269:0 Computed 1 initial states...
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      | <<"4", "2">>
      2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
      2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
      2210:0 The number of states generated: 2
      Simulation using seed 4 and aril 2
---*)
---- MODULE get_config_seed_aril ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ PrintT(<<TLCGet("config").seed, TLCGet("config").aril>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<"4", "0">>
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 2
---*)
