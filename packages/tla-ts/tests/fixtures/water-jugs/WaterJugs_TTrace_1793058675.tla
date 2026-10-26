---- MODULE WaterJugs_TTrace_1793058675 ----
EXTENDS Sequences, TLCExt, Toolbox, WaterJugs, Naturals, TLC

_expression ==
    LET WaterJugs_TEExpression == INSTANCE WaterJugs_TEExpression
    IN WaterJugs_TEExpression!expression
----

_trace ==
    LET WaterJugs_TETrace == INSTANCE WaterJugs_TETrace
    IN WaterJugs_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        small = (3)
        /\
        large = (4)
    )
----

_init ==
    /\ large = _TETrace[1].large
    /\ small = _TETrace[1].small
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ large  = _TETrace[i].large
        /\ large' = _TETrace[j].large
        /\ small  = _TETrace[i].small
        /\ small' = _TETrace[j].small

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("WaterJugs_TTrace_1793058675.json", _TETrace)

=============================================================================

 Note that you can extract this module `WaterJugs_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `WaterJugs_TEExpression.tla` file takes precedence 
  over the module `WaterJugs_TEExpression` below).

---- MODULE WaterJugs_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, WaterJugs, Naturals, TLC

expression == 
    [
        \* To hide variables of the `WaterJugs` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        large |-> large
        ,small |-> small
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_largeUnchanged |-> large = large'
        
        \* Format the `large` variable as Json value.
        \* ,_largeJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(large)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_largeModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].large # _TETrace[s-1].large
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE WaterJugs_TETrace ----
\*EXTENDS IOUtils, WaterJugs, TLC
\*
\*trace == IODeserialize("WaterJugs_TTrace_1793058675.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE WaterJugs_TETrace ----
EXTENDS WaterJugs, TLC

trace == 
    <<
    ([small |-> 0,large |-> 0]),
    ([small |-> 0,large |-> 5]),
    ([small |-> 3,large |-> 2]),
    ([small |-> 0,large |-> 2]),
    ([small |-> 2,large |-> 0]),
    ([small |-> 2,large |-> 5]),
    ([small |-> 3,large |-> 4])
    >>
----


=============================================================================

---- CONFIG WaterJugs_TTrace_1793058675 ----
CONSTANTS
    SmallCapacity = 3
    LargeCapacity = 5
    Goal = 4

INVARIANT
    _inv

CHECK_DEADLOCK
    \* CHECK_DEADLOCK off because of PROPERTY or INVARIANT above.
    FALSE

INIT
    _init

NEXT
    _next

CONSTANT
    _TETrace <- _trace

ALIAS
    _expression
=============================================================================
\* Generated on Mon Oct 26 16:51:15 PDT 2026