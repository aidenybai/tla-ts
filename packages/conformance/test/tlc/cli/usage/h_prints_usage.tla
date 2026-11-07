(*---
description: -h is the same as -help.
ref: tlc2/TLC.java#printUsage
outcome: usage-error
config: ""
args:
  - -h
---*)
---- MODULE h_prints_usage ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: "| \e[1mNAME\e[0m

    | \tTLC - provides model checking and simulation of TLA+ specifications - Version 2026.11.03.180953

    | \e[1mSYNOPSIS\e[0m

    | \t\e[1mTLC\e[0m [\e[1m-h\e[0m] [\e[1m-cleanup\e[0m] [\e[1m-continue\e[0m] [\e[1m-deadlock\e[0m] [\e[1m-debug\e[0m] [\e[1m-difftrace\e[0m] [\e[1m-gzip\e[0m] [\e[1m-noGenerateSpecTE\e[0m] [\e[1m-nowarning\e[0m] [\e[1m-terse\e[0m] [\e[1m-tool\e[0m] [\e[1m-view\e[0m] [\e[1m-checkpoint\e[0m \e[3mminutes\e[0m] [\e[1m-config\e[0m \e[3mfile\e[0m] [\e[1m-coverage\e[0m \e[3mminutes\e[0m] [\e[1m-dfid\e[0m \e[3mnum\e[0m] [\e[1m-dump\e[0m \e[3mformat file\e[0m] [\e[1m-dumpTrace\e[0m \e[3mformat file\e[0m] [\e[1m-fp\e[0m \e[3mN\e[0m] [\e[1m-fpbits\e[0m \e[3mnum\e[0m] [\e[1m-fpmem\e[0m \e[3mnum\e[0m] [\e[1m-inv\e[0m \e[3mexpr\e[0m] [\e[1m-invlevel\e[0m \e[3mn\e[0m] [\e[1m-loadTrace\e[0m \e[3mformat file\e[0m] [\e[1m-maxSetSize\e[0m \e[3mnum\e[0m] [\e[1m-messagesAsErrors\e[0m \e[3mcodes\e[0m] [\e[1m-metadir\e[0m \e[3mpath\e[0m] [\e[1m-postCondition\e[0m \e[3mmod!oper\e[0m] [\e[1m-recover\e[0m \e[3mid\e[0m] [\e[1m-suppressMessages\e[0m \e[3mcodes\e[0m] [\e[1m-teSpecOutDir\e[0m \e[3msome-dir-name\e[0m] [\e[1m-userFile\e[0m \e[3mfile\e[0m] [\e[1m-workers\e[0m \e[3mnum\e[0m] \e[1m-debugger\e[0m \e[3mnosuspend\e[0m SPEC

    | \t\e[1mTLC\e[0m [\e[1m-h\e[0m] [\e[1m-cleanup\e[0m] [\e[1m-continue\e[0m] [\e[1m-deadlock\e[0m] [\e[1m-debug\e[0m] [\e[1m-difftrace\e[0m] [\e[1m-gzip\e[0m] [\e[1m-noGenerateSpecTE\e[0m] [\e[1m-nowarning\e[0m] [\e[1m-terse\e[0m] [\e[1m-tool\e[0m] [\e[1m-aril\e[0m \e[3mnum\e[0m] [\e[1m-checkpoint\e[0m \e[3mminutes\e[0m] [\e[1m-config\e[0m \e[3mfile\e[0m] [\e[1m-coverage\e[0m \e[3mminutes\e[0m] [\e[1m-depth\e[0m \e[3mnum\e[0m] [\e[1m-dump\e[0m \e[3mformat file\e[0m] [\e[1m-dumpTrace\e[0m \e[3mformat file\e[0m] [\e[1m-fp\e[0m \e[3mN\e[0m] [\e[1m-fpbits\e[0m \e[3mnum\e[0m] [\e[1m-fpmem\e[0m \e[3mnum\e[0m] [\e[1m-inv\e[0m \e[3mexpr\e[0m] [\e[1m-invlevel\e[0m \e[3mn\e[0m] [\e[1m-loadTrace\e[0m \e[3mformat file\e[0m] [\e[1m-maxSetSize\e[0m \e[3mnum\e[0m] [\e[1m-messagesAsErrors\e[0m \e[3mcodes\e[0m] [\e[1m-metadir\e[0m \e[3mpath\e[0m] [\e[1m-postCondition\e[0m \e[3mmod!oper\e[0m] [\e[1m-recover\e[0m \e[3mid\e[0m] [\e[1m-seed\e[0m \e[3mnum\e[0m] [\e[1m-suppressMessages\e[0m \e[3mcodes\e[0m] [\e[1m-teSpecOutDir\e[0m \e[3msome-dir-name\e[0m] [\e[1m-userFile\e[0m \e[3mfile\e[0m] [\e[1m-workers\e[0m \e[3mnum\e[0m] \e[1m-debugger\e[0m \e[3mnosuspend\e[0m -simulate [file=X,num=Y] SPEC

    | \e[1mDESCRIPTION\e[0m

    | \tThe model checker (\e[1mTLC\e[0m) provides the functionalities of model checking

    | \tor simulation of TLA+ specifications. It may be invoked from the command

    | \tline, or via the model checking functionality of the Toolbox.

    | \tBy default, \e[1mTLC\e[0m starts in the model checking mode using breadth-first

    | \tapproach for the state space exploration.

    | \tA pretty-printed and in-depth description of \e[1mTLC\e[0m can be found at:

    | \t\t    https://lamport.azurewebsites.net/tla/current-tools.pdf

    | \e[1mOPTIONS\e[0m

    | \t\e[1m-aril\e[0m \e[3mnum\e[0m

    | \t\tadjust the seed for random simulation; defaults to 0

    | \t\e[1m-checkpoint\e[0m \e[3mminutes\e[0m

    | \t\tinterval between check point; defaults to 30

    | \t\e[1m-cleanup\e[0m

    | \t\tclean up the states directory

    | \t\e[1m-config\e[0m \e[3mfile\e[0m

    | \t\tprovide the configuration file; defaults to SPEC.cfg

    | \t\e[1m-continue\e[0m

    | \t\tcontinue running even when an invariant is violated; default

    | \t\tbehavior is to halt on first violation

    | \t\e[1m-coverage\e[0m \e[3mminutes\e[0m

    | \t\tinterval between the collection of coverage information;

    | \t\tif not specified, no coverage will be collected

    | \t\e[1m-deadlock\e[0m

    | \t\tif specified DO NOT CHECK FOR DEADLOCK. Setting the flag is

    | \t\tthe same as setting CHECK_DEADLOCK to FALSE in config

    | \t\tfile. When -deadlock is specified, config entry is

    | \t\tignored; default behavior is to check for deadlocks

    | \t\e[1m-debug\e[0m

    | \t\tprint various debugging information - not for production use

    | \t\e[1m-debugger\e[0m \e[3mnosuspend\e[0m

    | \t\trun simulation or model-checking in debug mode such that TLC's

    | \t\tstate-space exploration can be temporarily halted and variables

    | \t\tbe inspected. The only debug front-end so far is the TLA+

    | \t\tVSCode extension, which has to be downloaded and configured

    | \t\tseparately, though other front-ends could be implemeted via the

    | \t\tdebug-adapter-protocol.

    | \t\tSpecifying the optional parameter 'nosuspend' causes

    | \t\tTLC to start state-space exploration without waiting for a

    | \t\tdebugger front-end to connect. Without 'nosuspend', TLC

    | \t\tsuspends state-space exploration before the first ASSUME is

    | \t\tevaluated (but after constants are processed). With 'nohalt',

    | \t\tTLC does not halt state-space exploration when an evaluation

    | \t\tor runtime error is caught. Without 'nohalt', evaluation or

    | \t\truntime errors can be inspected in the debugger before TLC

    | \t\tterminates. The optional parameter 'port=1274' makes the

    | \t\tdebugger listen on port 1274 instead of on the standard

    | \t\tport 4712, and 'port=0' lets the debugger choose a port.

    | \t\tMultiple optional parameters must be comma-separated.

    | \t\tSpecifying '-debugger' implies '-workers 1'.

    | \t\e[1m-depth\e[0m \e[3mnum\e[0m

    | \t\tspecifies the depth of random simulation; defaults to 100

    | \t\e[1m-dfid\e[0m \e[3mnum\e[0m

    | \t\trun the model check in depth-first iterative deepening

    | \t\tstarting with an initial depth of 'num'

    | \t\e[1m-difftrace\e[0m

    | \t\tshow only the differences between successive states when

    | \t\tprinting trace information; defaults to printing

    | \t\tfull state descriptions

    | \t\e[1m-dump\e[0m \e[3mformat file\e[0m

    | \t\tdump all states into the specified file.

    | \t\tThe format parameter can be omitted, or it can be a comma-separated

    | \t\tlist beginning with 'dot' that may also contain a subset of

    | \t\tthe items 'colorize', 'actionlabels', and 'constrained'. If format is

    | \t\tomitted, TLC writes a list of all reachable states, described by TLA+

    | \t\tformulas, on file. Otherwise, TLC writes the state graph in dot format,

    | \t\tthe input format of the GraphViz program for displaying graphs.\ 

    | \t\tThe parameter 'colorize' indicates that state transitions should be\ 

    | \t\tcolored according to the action generating the transition, \ 

    | \t\tand 'actionlabels' indicates that they should be labeled with\ 

    | \t\tthe name of the action. The parameter 'constrained' causes TLC to include

    | \t\tstates in the dot file that are excluded from the model via a state or

    | \t\taction constraint.

    | \t\e[1m-dumpTrace\e[0m \e[3mformat file\e[0m

    | \t\tin case of a property violation, formats the TLA+ error trace

    | \t\tas the given format and dumps the output to the specified

    | \t\tfile.  The file is relative to the same directory as the

    | \t\tmain spec. At the time of writing, TLC supports the \"tla\"

    | \t\tand the \"json\" formats.  To dump to multiple formats, the

    | \t\t-dumpTrace parameter may appear multiple times.

    | \t\tThe git commits 1eb815620 and 386eaa19f show that adding new

    | \t\tformats is easy.

    | \t\e[1m-fp\e[0m \e[3mN\e[0m

    | \t\tuse the Nth irreducible polynomial from the list stored

    | \t\tin the class FP64

    | \t\e[1m-fpbits\e[0m \e[3mnum\e[0m

    | \t\tthe number of MSB used by MultiFPSet to create nested

    | \t\tFPSets; defaults to 1

    | \t\e[1m-fpmem\e[0m \e[3mnum\e[0m

    | \t\ta value in (0.0,1.0) representing the ratio of total

    | \t\tphysical memory to devote to storing the fingerprints

    | \t\tof found states; defaults to 0.25

    | \t\e[1m-gzip\e[0m

    | \t\tcontrol if gzip is applied to value input/output streams;

    | \t\tdefaults to 'off'

    | \t\e[1m-h\e[0m

    | \t\tdisplay these help instructions

    | \t\e[1m-inv\e[0m \e[3mexpr\e[0m

    | \t\tevaluate the given (state-level) TLA+ formula expr as an invariant

    | \t\e[1m-invlevel\e[0m \e[3mn\e[0m

    | \t\twith n \\in Nat, evaluate the invariant TLCGet(\"level\") < n,

    | \t\twhere TLCGet(\"level\") represents the distance of the current

    | \t\tstate to some initial state. In other words, TLC will print the

    | \t\tfirst trace it encounters with length n. After that, TLC will

    | \t\tstop, unless the '-continue' parameter is specified.

    | \t\e[1m-loadTrace\e[0m \e[3mformat file\e[0m

    | \t\tload a trace from the specified file in the given format

    | \t\tto use as a constraint. The file is relative to the same

    | \t\tdirectory as the main spec. At the time of writing, TLC

    | \t\tsupports the \"tlc\" and the \"json\" formats.

    | \t\tNote: -loadTrace is not supported in simulation mode.

    | \t\e[1m-maxSetSize\e[0m \e[3mnum\e[0m

    | \t\tthe size of the largest set which TLC will enumerate; defaults

    | \t\tto 1000000 (10^6)

    | \t\e[1m-messagesAsErrors\e[0m \e[3mcodes\e[0m

    | \t\ttreat specific messages as errors; comma-separated list of

    | \t\tmessage codes

    | \t\tSANY message codes can be found in https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tla2sany/semantic/ErrorCode.java#L38

    | \t\tTLC message codes can be found in https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java#L19

    | \t\e[1m-metadir\e[0m \e[3mpath\e[0m

    | \t\tspecify the directory in which to store metadata; defaults to

    | \t\tSPEC-directory/states if not specified

    | \t\e[1m-noGenerateSpecTE\e[0m

    | \t\tWhether to skip generating a trace exploration (TE) spec in

    | \t\tthe event of TLC finding a state or behavior that does

    | \t\tnot satisfy the invariants; TLC's default behavior is to

    | \t\tgenerate this spec.

    | \t\e[1m-nowarning\e[0m

    | \t\tdisable all warnings; defaults to reporting warnings

    | \t\e[1m-postCondition\e[0m \e[3mmod!oper\e[0m

    | \t\tevaluate the given (constant-level) operator oper in the TLA+

    | \t\tmodule mod at the end of model-checking.

    | \t\e[1m-recover\e[0m \e[3mid\e[0m

    | \t\trecover from the checkpoint with the specified id

    | \t\e[1m-seed\e[0m \e[3mnum\e[0m

    | \t\tprovide the seed for random simulation; defaults to a

    | \t\trandom long pulled from a pseudo-RNG

    | \t\e[1m-simulate\e[0m

    | \t\trun in simulation mode; optional parameters may be specified

    | \t\tcomma delimited: 'num=X' where X is the maximum number of

    | \t\ttotal traces to generate and/or 'file=Y' where Y is the

    | \t\tabsolute-pathed prefix for trace file modules to be written

    | \t\tby the simulation workers; for example Y='/a/b/c/tr' would

    | \t\tproduce, e.g, '/a/b/c/tr_1_15'

    | \t\e[1m-suppressMessages\e[0m \e[3mcodes\e[0m

    | \t\tsuppress specific messages; comma-separated list of

    | \t\tmessage codes; cannot be combined with -nowarning

    | \t\tSANY message codes can be found in https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tla2sany/semantic/ErrorCode.java#L38

    | \t\tTLC message codes can be found in https://github.com/tlaplus/tlaplus/blob/master/tlatools/org.lamport.tlatools/src/tlc2/output/EC.java#L19

    | \t\e[1m-teSpecOutDir\e[0m \e[3msome-dir-name\e[0m

    | \t\tDirectory to which to output the TE spec if TLC generates

    | \t\tan error trace. Can be a relative (to root spec dir)

    | \t\tor absolute path. By default the TE spec is output

    | \t\tto the same directory as the main spec.

    | \t\e[1m-terse\e[0m

    | \t\tdo not expand values in Print statements; defaults to

    | \t\texpanding values

    | \t\e[1m-tool\e[0m

    | \t\trun in 'tool' mode, surrounding output with message codes;

    | \t\tif '-generateSpecTE' is specified, this is enabled

    | \t\tautomatically

    | \t\e[1m-userFile\e[0m \e[3mfile\e[0m

    | \t\tan absolute path to a file in which to log user output (for

    | \t\texample, that which is produced by Print)

    | \t\e[1m-view\e[0m

    | \t\tapply VIEW (if provided) when printing out states

    | \t\e[1m-workers\e[0m \e[3mnum\e[0m

    | \t\tthe number of TLC worker threads; defaults to 1. Use 'auto'

    | \t\tto automatically select the number of threads based on the

    | \t\tnumber of available cores.

    | \e[1mTIPS\e[0m

    | \tWhen using the  '-generateSpecTE' you can version the generated specification by doing:

    | \t\t./tla2tools.jar -generateSpecTE MySpec.tla && NAME=\"SpecTE-$(date +%s)\" && sed -e \"s/MODULE SpecTE/MODULE $NAME/g\" SpecTE.tla > $NAME.tla

    | \tIf, while checking a SpecTE created via '-generateSpecTE', you get an error message concerning

    | \tCONSTANT declaration and you've previous used 'integers' as model values, rename your

    | \tmodel values to start with a non-numeral and rerun the model check to generate a new SpecTE.

    | \tIf, while checking a SpecTE created via '-generateSpecTE', you get a warning concerning

    | \tduplicate operator definitions, this is likely due to the 'monolith' specification

    | \tcreation. Try re-running TLC adding the 'nomonolith' option to the '-generateSpecTE'

    | \tparameter.

    | \tWhen using more than one worker, the reported depth might differ across runs. For small models, use a single worker. For large models, the diameter will almost always appear deterministic."
---*)
