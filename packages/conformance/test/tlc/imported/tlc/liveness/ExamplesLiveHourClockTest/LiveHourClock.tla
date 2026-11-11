(*---
description: Ported from TLC's ExamplesLiveHourClockTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesLiveHourClockTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |-
  (***************************************************************************)
  (* This is a TLC configuration file for testing that the specification     *)
  (* LSpec implies the properties AlwaysTick, AllTimes, and TypeInvariance.  *)
  (***************************************************************************)

  SPECIFICATION LSpec
     \* This statement tells TLC that LSpec is the specification that it
     \* should check.

  PROPERTIES AlwaysTick AllTimes TypeInvariance 
     \* This statement tells TLC to check that the specification
     \* implies each of the three properties AlwaysTick, AllTimes,
     \* and TypeInvariance (and hence that it implies their conjunction).
     \* The keywords PROPERTY and PROPERTIES can be used interchangeably.

  PROPERTY ClockSettles

  POSTCONDITION PostCondition
args:
  - -lncheck
  - final
  - -deadlock
includes:
  - HourClock.tla
---*)
--------------------------- MODULE LiveHourClock ----------------------------
(***************************************************************************)
(* This module adds the liveness condition to the hour clock specification *)
(* of module HourClock.                                                    *)
(***************************************************************************)

EXTENDS HourClock, TLC, TLCExt

LSpec == HC /\ WF_hr(HCnxt)
  (*************************************************************************)
  (* The specification with the liveness condition conjoined.              *)
  (*************************************************************************)

(***************************************************************************)
(* We now define some properties that LSpec satisfies.                     *)
(***************************************************************************)
AlwaysTick == []<><<HCnxt>>_hr
  (*************************************************************************)
  (* Asserts that infinitely many <<HCnxt>>_hr steps occur.                *)
  (*************************************************************************)

AllTimes == \A n \in 1..12 : []<>(hr = n)
  (*************************************************************************)
  (* Asserts that, for each time n in 1..12, hr infinitely often equals n. *)
  (*************************************************************************)

TypeInvariance == []HCini
  (*************************************************************************)
  (* The temporal formula asserting that HCini is always true.  It is      *)
  (* stated in this way to show you another way of telling TLC to check an *)
  (* invariant.                                                            *)
  (*************************************************************************)
  
-----------------------------------------------------------------------------
THEOREM  LSpec => AlwaysTick /\ AllTimes /\ TypeInvariance

ClockSettles == \E n \in 1..12 : <>[](hr = n)

PostCondition ==
   CounterExample =
    [ action |->
      { << <<1, [hr |-> 1]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<2, [hr |-> 2]>> >>,
        << <<2, [hr |-> 2]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<3, [hr |-> 3]>> >>,
        << <<3, [hr |-> 3]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<4, [hr |-> 4]>> >>,
        << <<4, [hr |-> 4]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<5, [hr |-> 5]>> >>,
        << <<5, [hr |-> 5]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<6, [hr |-> 6]>> >>,
        << <<6, [hr |-> 6]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<7, [hr |-> 7]>> >>,
        << <<7, [hr |-> 7]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<8, [hr |-> 8]>> >>,
        << <<8, [hr |-> 8]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<9, [hr |-> 9]>> >>,
        << <<9, [hr |-> 9]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<10, [hr |-> 10]>> >>,
        << <<10, [hr |-> 10]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<11, [hr |-> 11]>> >>,
        << <<11, [hr |-> 11]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<12, [hr |-> 12]>> >>,
        << <<12, [hr |-> 12]>>,
           [ name |-> "HCnxt",
             location |->
                 [ beginLine |-> 5,
                   beginColumn |-> 12,
                   endLine |-> 5,
                   endColumn |-> 46,
                   module |-> "HourClock" ] ],
           <<1, [hr |-> 1]>> >> },
  state |->
      { <<1, [hr |-> 1]>>,
        <<2, [hr |-> 2]>>,
        <<3, [hr |-> 3]>>,
        <<4, [hr |-> 4]>>,
        <<5, [hr |-> 5]>>,
        <<6, [hr |-> 6]>>,
        <<7, [hr |-> 7]>>,
        <<8, [hr |-> 8]>>,
        <<9, [hr |-> 9]>>,
        <<10, [hr |-> 10]>>,
        <<11, [hr |-> 11]>>,
        <<12, [hr |-> 12]>> } ]
=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    | line 74, col 18 to line 74, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 82, col 18 to line 82, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 83, col 18 to line 83, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 91, col 18 to line 91, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 92, col 18 to line 92, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 100, col 18 to line 100, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 101, col 18 to line 101, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 109, col 18 to line 109, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 110, col 18 to line 110, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 118, col 18 to line 118, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 119, col 18 to line 119, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 127, col 18 to line 127, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 128, col 18 to line 128, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 136, col 18 to line 136, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 137, col 18 to line 137, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 145, col 18 to line 145, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 146, col 18 to line 146, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 154, col 19 to line 154, col 20 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 155, col 19 to line 155, col 20 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 163, col 19 to line 163, col 20 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 164, col 19 to line 164, col 20 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 172, col 19 to line 172, col 20 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 173, col 19 to line 173, col 20 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 181, col 18 to line 181, col 19 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 183, col 15 to line 183, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 184, col 15 to line 184, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 185, col 15 to line 185, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 186, col 15 to line 186, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 187, col 15 to line 187, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 188, col 15 to line 188, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 189, col 15 to line 189, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 190, col 15 to line 190, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 191, col 15 to line 191, col 16 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 192, col 16 to line 192, col 17 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 193, col 16 to line 193, col 17 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    | line 194, col 16 to line 194, col 17 of module LiveHourClock
    | The field name "hr" in the record constructor is identical to the existing definition or declaration
    | named hr, located at line 3, col 10 to line 3, col 11 of module HourClock.
    | The field in the record will not take the value of the hr definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [hr |-> ...] = {"hr"} holds true.
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2190:0 Finished computing initial states: 12 distinct states generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 12 total distinct states at (<date>)
    2116:1 Temporal property ClockSettles was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    hr = 1
    2217:4 2: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 2
    2217:4 3: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 3
    2217:4 4: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 4
    2217:4 5: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 5
    2217:4 6: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 6
    2217:4 7: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 7
    2217:4 8: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 8
    2217:4 9: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 9
    2217:4 10: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 10
    2217:4 11: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 11
    2217:4 12: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    hr = 12
    2122:4 1: Back to state: <HCnxt line 5, col 12 to line 5, col 46 of module HourClock>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 24 states generated, 12 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
