from setuptools import find_packages, setup

setup(
    name='netbox-path',
    version='0.1',
    description='A plugin that allows users to map logical paths in infrastructure and attach them to devices, IPs, interfaces and virtual machines',
    url='https://gitlab.sol1.net/SOL1/netbox-path',
    author='Paul Damiani',
    license='Apache 2.0',
    install_requires=[],
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
)