---
layout: post
title: Ardunio, Avr and Scons
date: 2019-01-29 19:14 -0800
---

The Arduino IDE is a really good starting environment but I was looking for something a bit more flexible. 
Atmel studio is built for AVR chips but the environment obscures a lot of the process and adding an Ardunio library prevents the IDE 
from properly building the binary and working out how to fix the build was just too much of a hassle. This configuration allows the use of other 
environments besides the Ardunio IDE such as [Vscode](https://code.visualstudio.com/) and [Clion](https://www.jetbrains.com/clion/). 
Scons is a build system centered around python and can be easily configured to produce the correct binaries for AVR using avr-gcc, avr-g++, and avr-objcopy. The basic process is 
to compile the source using the avr-g++, avr-gcc and then converting the compiled object files to ihex.
The build process can also produce the necessary .hex files that can be flashed with [Mplab IPE](https://www.microchip.com/mplab/mplab-integrated-programming-environment) or avrdude.

The scons build is split up into two sections. setting up the AVR environment and then building the final hex file. Any additional libraries are just submodules in the 3rdparty folder. this first part sets up the environment along with the correct build configurations such as the avr compiler and the processor that this source will compile to. <code>Device</code> is set to whatever the associated device that will be compiled for. <code>CPU_FREQUENCY</code> will define the frequency that the processor is configured for. The actual frequency is defined by the fuse bits that will have to be set.

```
env = Environment()

# Set environment for AVR-GCC.
env['CC'] = 'avr-gcc'
env['CXX'] = 'avr-g++'
env['AS'] = 'avr-gcc'
env['CPPPATH'] = ['/usr/avr/include/', 'build']
env['OBJCOPY'] = 'avr-objcopy'
env['SIZE'] = 'avr-size'
env.Append(CCFLAGS = '-Os -Wall -Werror -flto')

# Declare some variables about microcontroller.
# Microcontroller type.
DEVICE = 'atmega328'
# Microcontroller frequency.
CPU_FREQUENCY = '8000000UL' # Hz


# Set environment for an Atmel AVR Atmega 328p microcontroller.
# Create and initialize the environment.
env.Append(CCFLAGS = '-mmcu=' + DEVICE)
env.Append(LINKFLAGS = '-mmcu=' + DEVICE)
env.Append(LINKFLAGS = '-Wl,-u,vfprintf -lprintf_min')
env.Append(LINKFLAGS = '-lm')
env.Append(CPPDEFINES = 'F_CPU=' + CPU_FREQUENCY)
```

The second section after this is just compiling the necessary code. In this case I'm using Minicore along with the Wire library and SD card library. the basic process is just to include all the necessary source files and defined the correct header locations. I could of separated Minicore into a static library along with the other libraries and link that separately but the compile times are so quick that it's not really necessary. its fairly easy to include other submodules and modify the build with other libraries.

```
 Define target name.
TARGET = 'build/main'

# Define source file.
env.Append(CPPPATH=[
    'src',
    '3rdparty/MiniCore/avr/cores/MCUdude_corefiles/',
    '3rdparty/MiniCore/avr/libraries/Wire/src/',
    '3rdparty/MiniCore/avr/libraries/SPI/src/',
    '3rdparty/SD/src/',
    '3rdparty/MiniCore/avr/variants/standard'])
wiring_pulse = env.Object(
    target = '3rdparty/MiniCore/avr/cores/MCUdude_corefiles/wiring_pulse_1.o',
    source = '3rdparty/MiniCore/avr/cores/MCUdude_corefiles/wiring_pulse.S')
sources = [
    Glob('./main.cpp'),
    Glob("3rdparty/MiniCore/avr/cores/MCUdude_corefiles/*.cpp"),
    Glob("3rdparty/MiniCore/avr/cores/MCUdude_corefiles/*.c"),
    Glob("3rdparty/MiniCore/avr/libraries/Wire/src/*/*.c"),
    Glob("3rdparty/MiniCore/avr/libraries/Wire/src/*.cpp"),
    Glob("3rdparty/MiniCore/avr/libraries/SPI/src/*.cpp"),
    Glob("3rdparty/SD/src/*/*.cpp"),
    Glob("3rdparty/SD/src/*.cpp"),
    wiring_pulse]

# Build the program.
# Default() is used so that when running scons only sources are
# compiled and linked- no other commands (see below) are run

Default(env.Program(target = TARGET + '.elf', source = sources))

# Create hex binary file.
Default(env.Command(TARGET + '.hex', TARGET + '.elf', env['OBJCOPY'] + ' -O ihex $SOURCE $TARGET'))

# Compute memory usage.
Default(env.Command(None, TARGET + '.elf', env['SIZE'] + ' -C --mcu=' + DEVICE + ' $SOURCE'))
Default(env.Command(None, None, 'ctags -R -f src/.tags src'))
```


Build Template: [source](https://github.com/GaitRehabilitation/avr_ardunio_template) 
